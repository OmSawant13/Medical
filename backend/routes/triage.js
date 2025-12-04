const express = require('express');
const auth = require('../middleware/auth');
const { PriorityQueue, erTriageQueue } = require('../utils/dataStructures');
const router = express.Router();

// Add patient to ER triage queue
router.post('/er/add-patient', auth, async (req, res) => {
  try {
    const { patientId, patientName, condition, vitalSigns, severity } = req.body;

    // Priority mapping: 1 = Critical, 2 = High, 3 = Medium, 4 = Low
    const priorityMap = {
      'critical': 1,
      'high': 2,
      'medium': 3,
      'low': 4
    };

    const priority = priorityMap[severity.toLowerCase()] || 4;

    const patient = {
      patientId,
      patientName,
      condition,
      vitalSigns,
      severity,
      arrivalTime: new Date().toISOString()
    };

    erTriageQueue.enqueue(patient, priority);

    res.json({
      success: true,
      message: 'Patient added to ER triage queue',
      patient,
      priority,
      queuePosition: erTriageQueue.size(),
      dataStructure: 'Min-Heap Priority Queue',
      complexity: 'O(log n)'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding patient to triage', error: error.message });
  }
});

// Get next patient from ER queue (highest priority)
router.get('/er/next-patient', auth, async (req, res) => {
  try {
    const nextPatient = erTriageQueue.dequeue();

    if (nextPatient) {
      const waitTime = Date.now() - nextPatient.timestamp;
      
      res.json({
        success: true,
        patient: nextPatient.item,
        priority: nextPatient.priority,
        waitTime: `${Math.floor(waitTime / 1000)}s`,
        remainingInQueue: erTriageQueue.size(),
        dataStructure: 'Min-Heap Priority Queue',
        complexity: 'O(log n)'
      });
    } else {
      res.json({
        success: true,
        message: 'No patients in ER queue',
        remainingInQueue: 0
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving next patient', error: error.message });
  }
});

// View current ER queue without removing patients
router.get('/er/queue', auth, async (req, res) => {
  try {
    const queue = erTriageQueue.toArray();

    const queueWithWaitTimes = queue.map(item => ({
      ...item.item,
      priority: item.priority,
      severity: ['', 'Critical', 'High', 'Medium', 'Low'][item.priority],
      waitTime: `${Math.floor((Date.now() - item.timestamp) / 1000)}s`
    }));

    res.json({
      success: true,
      queue: queueWithWaitTimes,
      totalPatients: queue.length,
      dataStructure: 'Min-Heap Priority Queue',
      sortedBy: 'Priority (1=Critical, 4=Low)'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ER queue', error: error.message });
  }
});

// Simulate emergency alert based on vital signs
router.post('/er/check-vitals', auth, async (req, res) => {
  try {
    const { patientId, patientName, vitalSigns } = req.body;
    const { systolic, diastolic, heartRate, temperature, spo2 } = vitalSigns;

    let severity = 'low';
    let alerts = [];

    // Critical conditions
    if (systolic > 180 || diastolic > 110) {
      severity = 'critical';
      alerts.push('Severe Hypertension - Immediate attention required');
    }
    if (heartRate < 40 || heartRate > 150) {
      severity = 'critical';
      alerts.push('Abnormal heart rate - Critical');
    }
    if (spo2 < 90) {
      severity = 'critical';
      alerts.push('Low oxygen saturation - Critical');
    }
    if (temperature > 103) {
      severity = 'high';
      alerts.push('High fever - Urgent attention needed');
    }

    // High priority conditions
    if (systolic > 160 || diastolic > 100) {
      severity = severity === 'critical' ? 'critical' : 'high';
      alerts.push('Hypertension - Urgent evaluation needed');
    }
    if (heartRate < 50 || heartRate > 120) {
      severity = severity === 'critical' ? 'critical' : 'high';
      alerts.push('Abnormal heart rate - Needs attention');
    }

    if (alerts.length > 0) {
      // Auto-add to triage queue if critical
      const priorityMap = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
      
      erTriageQueue.enqueue({
        patientId,
        patientName,
        condition: alerts.join(', '),
        vitalSigns,
        severity,
        autoTriaged: true,
        arrivalTime: new Date().toISOString()
      }, priorityMap[severity]);

      res.json({
        success: true,
        alert: true,
        severity,
        alerts,
        vitalSigns,
        action: 'Patient automatically added to ER triage queue',
        queuePosition: erTriageQueue.size()
      });
    } else {
      res.json({
        success: true,
        alert: false,
        message: 'All vitals within normal range',
        vitalSigns
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking vitals', error: error.message });
  }
});

// Clear ER queue (admin only)
router.delete('/er/clear-queue', auth, async (req, res) => {
  try {
    const queueSize = erTriageQueue.size();
    
    while (erTriageQueue.size() > 0) {
      erTriageQueue.dequeue();
    }

    res.json({
      success: true,
      message: 'ER triage queue cleared',
      patientsRemoved: queueSize
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing queue', error: error.message });
  }
});

module.exports = router;
