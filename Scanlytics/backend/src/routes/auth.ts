import express from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import { validatePatientRegistration, validateDoctorRegistration } from '../utils/validation';
import { generatePatientId, generateDoctorId, generateHospitalId } from '../utils/generators';
import { sanitizeInput, rateLimiter } from '../middleware/auth';

const router = express.Router();

// Rate limiting for auth routes
router.use(rateLimiter(15 * 60 * 1000, 5)); // 5 requests per 15 minutes
router.use(sanitizeInput);

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      name
    });

    await user.save();

    // Create role-specific profile
    let roleSpecificId = '';
    switch (role) {
      case 'patient':
        const patientId = generatePatientId();
        const patient = new Patient({
          userId: user._id,
          patientId,
          personalInfo: additionalData.personalInfo || {},
          medicalInfo: additionalData.medicalInfo || {}
        });
        await patient.save();
        roleSpecificId = patientId;
        break;

      case 'doctor':
        const doctorId = generateDoctorId();
        const doctor = new Doctor({
          userId: user._id,
          doctorId,
          specialization: additionalData.specialization || [],
          licenseNumber: additionalData.licenseNumber || '',
          experience: additionalData.experience || 0,
          qualifications: additionalData.qualifications || []
        });
        await doctor.save();
        roleSpecificId = doctorId;
        break;

      case 'hospital':
        roleSpecificId = generateHospitalId();
        break;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        roleSpecificId 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          roleSpecificId
        }
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check role match
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        error: 'Role mismatch'
      });
    }

    // Get role-specific ID
    let roleSpecificId = '';
    switch (user.role) {
      case 'patient':
        const patient = await Patient.findOne({ userId: user._id });
        roleSpecificId = patient?.patientId || '';
        break;
      case 'doctor':
        const doctor = await Doctor.findOne({ userId: user._id });
        roleSpecificId = doctor?.doctorId || '';
        break;
      case 'hospital':
        roleSpecificId = generateHospitalId(); // For demo purposes
        break;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        roleSpecificId 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          roleSpecificId,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid user'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

export default router;
