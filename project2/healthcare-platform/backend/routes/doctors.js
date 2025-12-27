const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get doctor details by doctorId
router.get('/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findOne({ doctorId })
      .populate('userId', 'name email');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Return full doctor details
    res.json({
      success: true,
      data: {
        doctorId: doctor.doctorId,
        name: doctor.userId?.name || 'Dr. Unknown',
        email: doctor.userId?.email || '',
        specialization: Array.isArray(doctor.specialization) 
          ? doctor.specialization 
          : (doctor.specialization ? [doctor.specialization] : []),
        experience: doctor.experience || 0,
        consultationFee: doctor.consultationFee || 0,
        availability: doctor.availability || {},
        qualifications: Array.isArray(doctor.qualifications) 
          ? doctor.qualifications 
          : (doctor.qualifications ? [doctor.qualifications] : []),
        licenseNumber: doctor.licenseNumber || '',
        hospitalAffiliation: doctor.hospitalAffiliation || ''
      }
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor details',
      details: error.message
    });
  }
});

module.exports = router;

