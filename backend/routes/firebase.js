const express = require('express');
const { getFirestore, getMessaging, isFirebaseAvailable } = require('../config/firebase');
const auth = require('../middleware/auth');
const router = express.Router();

// Real-time patient vitals monitoring
router.post('/vitals/update', auth, async (req, res) => {
  try {
    const { patientId, vitalSigns } = req.body;
    const db = getFirestore();

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Firebase not configured' 
      });
    }

    // Check for critical conditions first
    const alerts = [];
    if (vitalSigns.systolic > 180 || vitalSigns.diastolic > 110) {
      alerts.push('Critical: Severe Hypertension');
    }
    if (vitalSigns.heartRate < 40 || vitalSigns.heartRate > 150) {
      alerts.push('Critical: Abnormal Heart Rate');
    }
    if (vitalSigns.spo2 < 90) {
      alerts.push('Critical: Low Oxygen Saturation');
    }

    try {
      // Store vital signs in Firestore
      const vitalRef = db.collection('vitalSigns').doc(patientId);
      await vitalRef.set({
        ...vitalSigns,
        timestamp: new Date().toISOString(),
        updatedBy: req.user.userId
      }, { merge: true });

      // If critical, create alert
      if (alerts.length > 0) {
        await db.collection('alerts').add({
          patientId,
          type: 'CRITICAL_VITALS',
          alerts,
          vitalSigns,
          timestamp: new Date().toISOString(),
          status: 'active'
        });
      }

      res.json({
        success: true,
        message: 'Vitals updated in Firebase Firestore',
        alerts: alerts.length > 0 ? alerts : null,
        storedIn: 'Firebase Firestore'
      });
    } catch (firestoreError) {
      // Firestore not enabled - provide helpful message
      if (firestoreError.message.includes('NOT_FOUND')) {
        return res.json({
          success: false,
          message: 'Firestore database not enabled',
          vitalsChecked: true,
          alerts: alerts.length > 0 ? alerts : null,
          instructions: {
            step1: 'Go to Firebase Console: https://console.firebase.google.com/project/thw-2-3c16b/firestore',
            step2: 'Click "Create database"',
            step3: 'Choose "Start in test mode"',
            step4: 'Select your region',
            step5: 'Click "Enable"'
          },
          note: 'Vitals were checked for alerts but not stored in Firestore'
        });
      }
      throw firestoreError;
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating vitals', 
      error: error.message 
    });
  }
});

// Get real-time patient vitals
router.get('/vitals/:patientId', auth, async (req, res) => {
  try {
    const db = getFirestore();
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Firebase not configured' 
      });
    }

    const vitalDoc = await db.collection('vitalSigns').doc(req.params.patientId).get();

    if (!vitalDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'No vitals found for patient' 
      });
    }

    res.json({
      success: true,
      vitals: vitalDoc.data()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching vitals', 
      error: error.message 
    });
  }
});

// Send push notification
router.post('/notifications/send', auth, async (req, res) => {
  try {
    const { deviceToken, title, body, data } = req.body;
    const messaging = getMessaging();

    if (!messaging) {
      return res.status(503).json({ 
        success: false, 
        message: 'Firebase Messaging not configured' 
      });
    }

    const message = {
      notification: { title, body },
      data: data || {},
      token: deviceToken
    };

    const response = await messaging.send(message);

    res.json({
      success: true,
      messageId: response,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error sending notification', 
      error: error.message 
    });
  }
});

// Get active alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const db = getFirestore();
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Firebase not configured' 
      });
    }

    // Get all alerts (without complex query that requires index)
    const alertsSnapshot = await db.collection('alerts')
      .limit(50)
      .get();

    const alerts = [];
    alertsSnapshot.forEach(doc => {
      alerts.push({ id: doc.id, ...doc.data() });
    });

    // Sort in memory
    alerts.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0);
      const timeB = new Date(b.timestamp || 0);
      return timeB - timeA;
    });

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching alerts', 
      error: error.message 
    });
  }
});

// Firebase status check
router.get('/status', (req, res) => {
  try {
    const available = isFirebaseAvailable();
    const db = getFirestore();
    const messaging = getMessaging();

    res.json({
      success: true,
      firebase: {
        available: available,
        firestore: db ? 'connected' : 'not configured',
        messaging: messaging ? 'available' : 'not configured',
        projectId: 'thw-2-3c16b',
        setupInstructions: available ? null : {
          step1: 'Go to https://console.firebase.google.com/project/thw-2-3c16b/settings/serviceaccounts/adminsdk',
          step2: 'Click "Generate new private key"',
          step3: 'Save the JSON file as backend/firebase-credentials.json',
          step4: 'Restart the server'
        }
      }
    });
  } catch (error) {
    res.json({
      success: false,
      firebase: {
        status: 'error',
        message: error.message
      }
    });
  }
});

module.exports = router;
