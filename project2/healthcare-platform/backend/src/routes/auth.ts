import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import { generatePatientId, generateDoctorId, generateHospitalId } from '../utils/generators';
import { generateToken, verifyToken, JWTPayload } from '../utils/jwt';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name, ...additionalData } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, role, and name are required'
      });
    }

    // Validate role
    if (!['patient', 'doctor', 'hospital'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be patient, doctor, or hospital'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      role,
      name: name.trim()
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

    // Generate JWT token using centralized utility
    const token = generateToken({
      userId: user._id.toString(),
        email: user.email, 
        role: user.role,
        roleSpecificId 
    });

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
    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
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

    // Generate token using centralized utility
    const token = generateToken({
      userId: user._id.toString(),
        email: user.email, 
        role: user.role,
        roleSpecificId 
    });

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
        error: 'Token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify the old token (even if expired, we can still refresh it)
    let decoded: JWTPayload | null = null;
    try {
      decoded = verifyToken(token);
    } catch (error: any) {
      // If token is expired, try to decode it anyway for refresh
      try {
        decoded = jwt.decode(token) as JWTPayload | null;
        if (!decoded || !decoded.userId) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          });
        }
      } catch (decodeError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive user',
        code: 'INVALID_USER'
      });
    }

    // Get role-specific ID
    let roleSpecificId = '';
    try {
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
          roleSpecificId = generateHospitalId();
          break;
      }
    } catch (profileError) {
      console.error('⚠️ Error fetching profile for refresh:', profileError);
    }

    // Generate new token with all fields
    const newToken = generateToken({
      userId: user._id.toString(),
        email: user.email, 
      role: user.role,
      roleSpecificId
    });

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error: any) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
});

export default router;
