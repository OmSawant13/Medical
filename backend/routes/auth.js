const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Family = require('../models/Family');
const { auth } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (user_id) => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (patient, doctor, or hospital)
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['patient', 'doctor', 'hospital']).withMessage('Invalid role'),
  body('phone').optional().trim(),
  body('doctor_id').optional().trim(),
  body('hospital_id').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zipCode').optional().trim(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('age').optional().isInt({ min: 0, max: 150 }),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('ongoingMedications').optional().isArray(),
  body('chronicConditions').optional().isArray(),
  body('specialization').optional().trim(),
  body('qualification').optional().trim(),
  body('education').optional().isArray(),
  body('experience').optional().isInt({ min: 0 }),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('clinicName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, email, password, role, phone, doctor_id, hospital_id, allergies,
      address, city, state, zipCode, latitude, longitude,
      age, gender, ongoingMedications, chronicConditions,
      specialization, qualification, education, experience, consultationFee, clinicName, consultationHours
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = new User({
      name,
      email,
      password,
      role,
      phone,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      doctor_id: role === 'doctor' ? doctor_id : undefined,
      hospital_id: role === 'hospital' ? hospital_id : undefined,
      allergies: allergies || [],
      ongoingMedications: ongoingMedications || [],
      chronicConditions: chronicConditions || [],
      specialization: role === 'doctor' ? specialization : undefined,
      qualification: role === 'doctor' ? qualification : undefined,
      education: role === 'doctor' ? (education || []) : undefined,
      experience: role === 'doctor' && experience ? parseInt(experience) : undefined,
      consultationFee: role === 'doctor' && consultationFee ? parseFloat(consultationFee) : undefined,
      clinicName: role === 'doctor' ? clinicName : undefined,
      consultationHours: role === 'doctor' ? consultationHours : undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      isVerified: role === 'patient' // Patients auto-verified, doctors/hospitals need verification
    });

    // Create family for patients
    if (role === 'patient') {
      try {
        const family = new Family({
          members: []
        });
        await family.save();
        user.family_id = family.family_id;
      } catch (familyError) {
        console.error('Family creation error:', familyError);
        // If family creation fails, continue without family_id (optional for patients)
      }
    }

    await user.save();

    // Add user to family
    if (role === 'patient' && user.family_id) {
      await Family.findOneAndUpdate(
        { family_id: user.family_id },
        { $addToSet: { members: user.user_id } }
      );
    }

    const token = generateToken(user.user_id);

    res.status(201).json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        family_id: user.family_id
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if verified (for doctors and hospitals)
    if ((user.role === 'doctor' || user.role === 'hospital') && !user.isVerified) {
      return res.status(403).json({ message: 'Account pending verification' });
    }

    const token = generateToken(user.user_id);

    res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        family_id: user.family_id,
        doctor_id: user.doctor_id,
        hospital_id: user.hospital_id
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id }).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

