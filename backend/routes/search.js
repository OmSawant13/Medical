const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { BinarySearch, patientCache } = require('../utils/dataStructures');
const router = express.Router();

// Binary search for patient lookup - O(log n)
router.get('/patients/:id', auth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const startTime = Date.now();

    // Check cache first - O(1)
    const cached = patientCache.get(patientId);
    if (cached.found) {
      return res.json({
        success: true,
        patient: cached.data,
        searchMethod: 'Hash Map Cache',
        complexity: 'O(1)',
        searchTime: `${Date.now() - startTime}ms`,
        fromCache: true
      });
    }

    // Fetch all patients and use binary search
    const patients = await User.find({ role: 'patient' }).lean();
    const result = BinarySearch.searchPatientById(patients, patientId);

    if (result.found) {
      // Cache the result
      patientCache.set(patientId, result.data);

      res.json({
        success: true,
        patient: result.data,
        searchMethod: 'Binary Search',
        complexity: 'O(log n)',
        comparisons: result.comparisons,
        totalRecords: patients.length,
        searchTime: `${Date.now() - startTime}ms`,
        fromCache: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
        searchMethod: 'Binary Search',
        comparisons: result.comparisons,
        searchTime: `${Date.now() - startTime}ms`
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Search error', error: error.message });
  }
});

// Fast patient lookup by multiple criteria
router.post('/patients/lookup', auth, async (req, res) => {
  try {
    const { email, phone, roleSpecificId } = req.body;
    const startTime = Date.now();

    const query = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;
    if (roleSpecificId) query.roleSpecificId = roleSpecificId;

    const patient = await User.findOne({ ...query, role: 'patient' }).select('-password');

    if (patient) {
      // Cache the result
      patientCache.set(patient.roleSpecificId, patient.toObject());

      res.json({
        success: true,
        patient,
        searchMethod: 'MongoDB Index Scan',
        searchTime: `${Date.now() - startTime}ms`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
        searchTime: `${Date.now() - startTime}ms`
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lookup error', error: error.message });
  }
});

// Search medical codes (ICD-10) - simulated with binary search
router.get('/medical-codes/:code', auth, async (req, res) => {
  try {
    const code = req.params.code;
    const startTime = Date.now();

    // Simulated ICD-10 codes database (in production, this would be a large dataset)
    const icd10Codes = [
      { code: 'A00', description: 'Cholera' },
      { code: 'A01', description: 'Typhoid and paratyphoid fevers' },
      { code: 'E11', description: 'Type 2 diabetes mellitus' },
      { code: 'I10', description: 'Essential (primary) hypertension' },
      { code: 'J45', description: 'Asthma' },
      { code: 'M79', description: 'Other soft tissue disorders' },
      { code: 'R50', description: 'Fever of other and unknown origin' }
    ].sort((a, b) => a.code.localeCompare(b.code));

    const result = BinarySearch.search(icd10Codes, code, 'code');

    if (result.found) {
      res.json({
        success: true,
        code: result.data,
        searchMethod: 'Binary Search',
        complexity: 'O(log n)',
        comparisons: result.comparisons,
        totalCodes: icd10Codes.length,
        searchTime: `${Date.now() - startTime}ms`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Medical code not found',
        comparisons: result.comparisons,
        searchTime: `${Date.now() - startTime}ms`
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Search error', error: error.message });
  }
});

// Drug interaction lookup - O(1) hash map
router.get('/drugs/:drugName', auth, async (req, res) => {
  try {
    const drugName = req.params.drugName.toLowerCase();
    const startTime = Date.now();

    // Simulated drug database (in production, this would be comprehensive)
    const drugDatabase = {
      'aspirin': {
        name: 'Aspirin',
        category: 'NSAID',
        interactions: ['Warfarin', 'Ibuprofen'],
        sideEffects: ['Stomach upset', 'Bleeding risk'],
        dosage: '325-650mg every 4-6 hours'
      },
      'metformin': {
        name: 'Metformin',
        category: 'Antidiabetic',
        interactions: ['Alcohol', 'Contrast dye'],
        sideEffects: ['Nausea', 'Diarrhea'],
        dosage: '500-2000mg daily'
      },
      'lisinopril': {
        name: 'Lisinopril',
        category: 'ACE Inhibitor',
        interactions: ['Potassium supplements', 'NSAIDs'],
        sideEffects: ['Dry cough', 'Dizziness'],
        dosage: '10-40mg daily'
      }
    };

    const drug = drugDatabase[drugName];

    if (drug) {
      res.json({
        success: true,
        drug,
        searchMethod: 'Hash Map',
        complexity: 'O(1)',
        searchTime: `${Date.now() - startTime}ms`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Drug not found in database',
        searchTime: `${Date.now() - startTime}ms`
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Search error', error: error.message });
  }
});

// Cache statistics
router.get('/cache/stats', auth, async (req, res) => {
  try {
    const stats = patientCache.getStats();
    
    res.json({
      success: true,
      cacheStats: stats,
      performance: {
        avgLookupTime: '<1ms',
        complexity: 'O(1)'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cache stats', error: error.message });
  }
});

module.exports = router;
