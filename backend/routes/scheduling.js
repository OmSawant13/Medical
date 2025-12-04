const express = require('express');
const auth = require('../middleware/auth');
const { ORScheduler } = require('../utils/dataStructures');
const router = express.Router();

// Optimize OR schedule using Dynamic Programming
router.post('/optimize-or', auth, async (req, res) => {
  try {
    const { surgeries } = req.body;

    if (!surgeries || !Array.isArray(surgeries)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input: surgeries array required' 
      });
    }

    const startTime = Date.now();
    const result = ORScheduler.optimizeSchedule(surgeries);
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      optimization: result,
      algorithm: 'Dynamic Programming (Weighted Interval Scheduling)',
      complexity: 'O(n²)',
      processingTime: `${processingTime}ms`,
      inputSurgeries: surgeries.length,
      selectedSurgeries: result.totalSurgeries
    });
  } catch (error) {
    res.status(500).json({ message: 'Error optimizing OR schedule', error: error.message });
  }
});

// Get sample OR schedule optimization
router.get('/sample-or-schedule', auth, async (req, res) => {
  try {
    const sampleSurgeries = [
      {
        id: 1,
        patientName: 'John Smith',
        procedure: 'Appendectomy',
        startTime: 8,
        endTime: 10,
        priority: 1,
        revenue: 15000
      },
      {
        id: 2,
        patientName: 'Mary Johnson',
        procedure: 'Knee Replacement',
        startTime: 9,
        endTime: 13,
        priority: 3,
        revenue: 25000
      },
      {
        id: 3,
        patientName: 'Bob Wilson',
        procedure: 'Heart Bypass',
        startTime: 11,
        endTime: 16,
        priority: 1,
        revenue: 80000
      },
      {
        id: 4,
        patientName: 'Alice Brown',
        procedure: 'Gallbladder Removal',
        startTime: 14,
        endTime: 16,
        priority: 2,
        revenue: 18000
      },
      {
        id: 5,
        patientName: 'Charlie Davis',
        procedure: 'Cataract Surgery',
        startTime: 15,
        endTime: 17,
        priority: 3,
        revenue: 8000
      },
      {
        id: 6,
        patientName: 'Diana Evans',
        procedure: 'Hip Replacement',
        startTime: 17,
        endTime: 21,
        priority: 2,
        revenue: 35000
      }
    ];

    const result = ORScheduler.optimizeSchedule(sampleSurgeries);

    res.json({
      success: true,
      sampleData: sampleSurgeries,
      optimization: result,
      explanation: 'Dynamic Programming selects non-overlapping surgeries to maximize revenue',
      algorithm: 'Weighted Interval Scheduling'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating sample schedule', error: error.message });
  }
});

// Calculate optimal doctor shift schedule
router.post('/optimize-shifts', auth, async (req, res) => {
  try {
    const { doctors, shifts, requirements } = req.body;

    // Simplified shift optimization (greedy approach)
    const optimizedShifts = [];
    let totalCost = 0;

    shifts.forEach(shift => {
      const availableDoctors = doctors.filter(doc => 
        doc.availability.includes(shift.day) && 
        doc.specialization === shift.requiredSpecialization
      );

      if (availableDoctors.length > 0) {
        // Select doctor with lowest cost
        const selectedDoctor = availableDoctors.reduce((min, doc) => 
          doc.hourlyRate < min.hourlyRate ? doc : min
        );

        optimizedShifts.push({
          shift: shift.name,
          day: shift.day,
          time: shift.time,
          doctor: selectedDoctor.name,
          specialization: selectedDoctor.specialization,
          cost: selectedDoctor.hourlyRate * shift.hours
        });

        totalCost += selectedDoctor.hourlyRate * shift.hours;
      }
    });

    res.json({
      success: true,
      optimizedShifts,
      totalCost,
      coverageRate: `${((optimizedShifts.length / shifts.length) * 100).toFixed(2)}%`,
      algorithm: 'Greedy Optimization',
      complexity: 'O(n*m)'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error optimizing shifts', error: error.message });
  }
});

// Ambulance routing optimization (simplified)
router.post('/optimize-ambulance-route', auth, async (req, res) => {
  try {
    const { emergencies, ambulances } = req.body;

    // Simple nearest-neighbor assignment
    const assignments = [];
    
    emergencies.forEach(emergency => {
      const nearestAmbulance = ambulances.reduce((nearest, amb) => {
        const distance = Math.sqrt(
          Math.pow(emergency.location.lat - amb.location.lat, 2) +
          Math.pow(emergency.location.lng - amb.location.lng, 2)
        );
        
        return distance < nearest.distance 
          ? { ambulance: amb, distance } 
          : nearest;
      }, { ambulance: null, distance: Infinity });

      if (nearestAmbulance.ambulance) {
        assignments.push({
          emergency: emergency.id,
          location: emergency.location,
          severity: emergency.severity,
          ambulance: nearestAmbulance.ambulance.id,
          estimatedDistance: `${(nearestAmbulance.distance * 100).toFixed(2)} km`,
          estimatedTime: `${Math.ceil(nearestAmbulance.distance * 10)} min`
        });
      }
    });

    res.json({
      success: true,
      assignments,
      algorithm: 'Nearest Neighbor (Greedy)',
      complexity: 'O(n*m)',
      totalEmergencies: emergencies.length,
      assignedAmbulances: assignments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error optimizing ambulance routes', error: error.message });
  }
});

// Budget allocation optimization
router.post('/optimize-budget', auth, async (req, res) => {
  try {
    const { totalBudget, departments } = req.body;

    // Weighted allocation based on priority and patient volume
    let totalWeight = departments.reduce((sum, dept) => 
      sum + (dept.priority * dept.patientVolume), 0
    );

    const allocations = departments.map(dept => {
      const weight = (dept.priority * dept.patientVolume) / totalWeight;
      const allocation = totalBudget * weight;

      return {
        department: dept.name,
        priority: dept.priority,
        patientVolume: dept.patientVolume,
        allocation: Math.round(allocation),
        percentage: `${(weight * 100).toFixed(2)}%`
      };
    });

    res.json({
      success: true,
      totalBudget,
      allocations,
      algorithm: 'Weighted Distribution',
      complexity: 'O(n)'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error optimizing budget', error: error.message });
  }
});

module.exports = router;
