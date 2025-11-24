const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { logAccessSync } = require('../middleware/accessLogger');
const { searchNearbyHospitals } = require('../utils/googleMaps');

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// @route   GET /api/hospitals/nearby
// @desc    Find nearby hospitals (Patient)
// @access  Private (Patient)
router.get('/nearby', [
  auth,
  authorize('patient'),
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radius').optional().isFloat({ min: 0, max: 1000 }).withMessage('Radius must be between 0 and 1000 km'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { latitude, longitude, radius = 50, limit = 20 } = req.query;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);
    const limitNum = parseInt(limit);

    // Find all verified hospitals from database
    const dbHospitals = await User.find({ 
      role: 'hospital', 
      isVerified: true,
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    })
      .select('user_id name hospital_id address city state zipCode latitude longitude phone')
      .limit(1000);

    // Optionally fetch from Google Maps API (if configured)
    let googleHospitals = [];
    if (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key') {
      try {
        googleHospitals = await searchNearbyHospitals(lat, lon, radiusKm * 1000); // Convert km to meters
        // Convert Google Places results to our format
        googleHospitals = googleHospitals.map(place => ({
          user_id: `GOOGLE-${place.place_id}`,
          name: place.name,
          hospital_id: place.place_id,
          address: place.address,
          city: 'Unknown',
          state: 'Unknown',
          zipCode: '',
          latitude: place.latitude,
          longitude: place.longitude,
          phone: '',
          isGooglePlace: true,
          rating: place.rating
        }));
      } catch (error) {
        console.error('Google Maps API Error:', error);
        // Continue with database hospitals only
      }
    }

    // Combine database and Google hospitals
    const allHospitals = [...dbHospitals.map(h => h.toObject()), ...googleHospitals];

    // Calculate distance and filter
    const hospitalsWithDistance = allHospitals
      .map(hospital => {
        const distance = calculateDistance(lat, lon, hospital.latitude, hospital.longitude);
        return {
          ...hospital,
          distance: parseFloat(distance.toFixed(2)) // Distance in km
        };
      })
      .filter(hospital => hospital.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limitNum);

    res.json({
      success: true,
      count: hospitalsWithDistance.length,
      hospitals: hospitalsWithDistance,
      searchLocation: { latitude: lat, longitude: lon },
      radius: radiusKm
    });
  } catch (error) {
    console.error('Nearby Hospitals Error:', error);
    res.status(500).json({ success: false, message: 'Server error finding nearby hospitals' });
  }
});

// @route   GET /api/hospitals/patient/:patientId
// @desc    Lookup patient by ID (Hospital)
// @access  Private (Hospital)
router.get('/patient/:patientId', [auth, authorize('hospital')], async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOne({ user_id: patientId, role: 'patient' })
      .select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Log access
    await logAccessSync(
      patientId,
      req.user.user_id,
      'view_profile',
      'patient_profile',
      patientId,
      req
    );

    // Hospitals have read-only access - return minimal info
    res.json({
      patient_id: patient.user_id,
      name: patient.name,
      allergies: patient.allergies
    });
  } catch (error) {
    console.error('Lookup Patient Error:', error);
    res.status(500).json({ message: 'Server error looking up patient' });
  }
});

// @route   GET /api/hospitals/search
// @desc    Search hospitals by city/state (for patients)
// @access  Private (Patient)
router.get('/search', [auth, authorize('patient')], async (req, res) => {
  try {
    const { city, state, name } = req.query;
    let query = { role: 'hospital', isVerified: true };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }

    const hospitals = await User.find(query)
      .select('user_id name hospital_id address city state zipCode phone')
      .limit(100);

    res.json({
      success: true,
      count: hospitals.length,
      hospitals
    });
  } catch (error) {
    console.error('Search Hospitals Error:', error);
    res.status(500).json({ success: false, message: 'Server error searching hospitals' });
  }
});

// @route   GET /api/hospitals/:hospitalId/doctors
// @desc    Get doctors available in a hospital with availability slots
// @access  Private (Patient)
router.get('/:hospitalId/doctors', [auth, authorize('patient')], async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const Appointment = require('../models/Appointment');

    // Verify hospital exists
    const hospital = await User.findOne({ 
      user_id: hospitalId, 
      role: 'hospital', 
      isVerified: true 
    });

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    // Get doctors associated with this hospital
    const doctors = await User.find({ 
      role: 'doctor', 
      hospital_id: hospitalId,
      isVerified: true 
    })
      .select('user_id name email phone doctor_id specialization qualification education experience consultationFee clinicName consultationHours address city state')
      .sort({ specialization: 1, name: 1 });

    // Get availability for each doctor
    const doctorsWithAvailability = await Promise.all(
      doctors.map(async (doctor) => {
        const doctorObj = doctor.toObject();
        
        // Get upcoming appointments for this doctor
        const upcomingAppointments = await Appointment.find({
          doctor_id: doctor.user_id,
          status: { $in: ['pending', 'accepted'] },
          date_time: { $gte: new Date() }
        })
          .select('date_time')
          .sort({ date_time: 1 })
          .limit(20);

        // Generate available slots based on consultation hours
        const availableSlots = [];
        const today = new Date();
        const daysToShow = 7; // Show next 7 days
        
        for (let i = 0; i < daysToShow; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          
          if (doctor.consultationHours && doctor.consultationHours[dayName] && doctor.consultationHours[dayName].available) {
            const hours = doctor.consultationHours[dayName];
            const startTime = hours.start.split(':');
            const endTime = hours.end.split(':');
            
            // Generate hourly slots
            for (let hour = parseInt(startTime[0]); hour < parseInt(endTime[0]); hour++) {
              const slotTime = new Date(checkDate);
              slotTime.setHours(hour, 0, 0, 0);
              
              // Check if slot is already booked
              const isBooked = upcomingAppointments.some(apt => {
                const aptTime = new Date(apt.date_time);
                return aptTime.getDate() === slotTime.getDate() &&
                       aptTime.getMonth() === slotTime.getMonth() &&
                       aptTime.getFullYear() === slotTime.getFullYear() &&
                       aptTime.getHours() === slotTime.getHours();
              });
              
              if (!isBooked && slotTime > new Date()) {
                availableSlots.push(slotTime.toISOString());
              }
            }
          }
        }

        return {
          ...doctorObj,
          availableSlots: availableSlots.slice(0, 10), // Show first 10 available slots
          totalAvailableSlots: availableSlots.length,
          upcomingAppointmentsCount: upcomingAppointments.length
        };
      })
    );

    res.json({
      success: true,
      hospital: {
        user_id: hospital.user_id,
        name: hospital.name,
        address: hospital.address,
        city: hospital.city,
        state: hospital.state
      },
      count: doctorsWithAvailability.length,
      doctors: doctorsWithAvailability
    });
  } catch (error) {
    console.error('Get Hospital Doctors Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching doctors' });
  }
});

module.exports = router;
