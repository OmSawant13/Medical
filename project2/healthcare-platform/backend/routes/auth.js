const express = require('express');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { generatePatientId, generateDoctorId, generateHospitalId } = require('../utils/generators');
const { generateTokenPair, verifyAccessToken, verifyRefreshToken } = require('../utils/jwt');
const { validateRegistration, validateLogin } = require('../utils/validation');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

console.log('🔐 Production Auth routes loaded');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const validation = validateRegistration(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    const { email, password, role, name } = validation.data;
    const additionalData = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists. Please login instead.'
      });
    }

    // Create user
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      role,
      name
    });

    await user.save();
    console.log('✅ User created:', user._id);

    // Create role-specific profile
    let roleSpecificId = '';
    try {
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
            specialization: Array.isArray(additionalData.specialization) 
              ? additionalData.specialization 
              : (additionalData.specialization ? [additionalData.specialization] : []),
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
    } catch (profileError) {
      console.error('⚠️ Error creating profile:', profileError);
      // Continue anyway - user is created
    }

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      roleSpecificId
    });

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSpecificId
        }
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    console.log('🔐 ========== LOGIN REQUEST ==========');
    console.log('📧 Request body:', {
      email: req.body.email,
      hasPassword: !!req.body.password,
      passwordLength: req.body.password ? req.body.password.length : 0,
      role: req.body.role
    });

    // Validate input
    const validation = validateLogin(req.body);
    console.log('✅ Validation result:', {
      valid: validation.valid,
      errors: validation.errors,
      sanitizedEmail: validation.data?.email
    });
    
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    const { email, role } = validation.data;
    const password = req.body.password; // Get password from original request
    console.log('🔑 Using password from req.body, length:', password ? password.length : 0);

    // Find user
    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password.'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: `Account is locked due to too many failed login attempts. Please try again in ${lockTime} minutes.`,
        retryAfter: lockTime
      });
    }

    // Verify password
    console.log('🔐 Verifying password...');
    const isValidPassword = await user.comparePassword(password);
    console.log('🔐 Password verification result:', isValidPassword);

    if (!isValidPassword) {
      console.error('❌ Invalid password for:', email);
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password.'
      });
    }
    
    console.log('✅ Password verified successfully');

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 && user.resetLoginAttempts) {
      await user.resetLoginAttempts();
      console.log('✅ Login attempts reset');
    }

    // Check role match (if role provided)
    if (role && user.role !== role) {
      console.error('❌ Role mismatch:', user.role, 'vs', role);
      return res.status(403).json({
        success: false,
        error: 'Role mismatch',
        message: `This account is registered as ${user.role}, not ${role}. Please select the correct role.`,
        userRole: user.role
      });
    }
    
    console.log('✅ Role check passed');

    // Get role-specific ID
    let roleSpecificId = '';
    try {
      switch (user.role) {
        case 'patient':
          const patient = await Patient.findOne({ userId: user._id });
          roleSpecificId = patient ? patient.patientId : '';
          break;
        case 'doctor':
          const doctor = await Doctor.findOne({ userId: user._id });
          roleSpecificId = doctor ? doctor.doctorId : '';
          break;
        case 'hospital':
          roleSpecificId = generateHospitalId();
          break;
      }
    } catch (profileError) {
      console.error('⚠️ Error fetching profile:', profileError);
    }

    // Generate token pair
    console.log('🔑 Generating token pair...');
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      roleSpecificId
    };
    console.log('🔑 Token payload:', tokenPayload);
    
    const tokenPair = generateTokenPair(tokenPayload);
    console.log('🔑 Token pair generated:', {
      hasAccessToken: !!tokenPair.accessToken,
      hasRefreshToken: !!tokenPair.refreshToken,
      accessTokenLength: tokenPair.accessToken ? tokenPair.accessToken.length : 0,
      refreshTokenLength: tokenPair.refreshToken ? tokenPair.refreshToken.length : 0
    });
    
    const { accessToken, refreshToken } = tokenPair;
    
    if (!accessToken || !refreshToken) {
      console.error('❌ CRITICAL: Token generation failed!', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        tokenPair
      });
      return res.status(500).json({
        success: false,
        error: 'Token generation failed',
        message: 'Failed to generate authentication tokens. Please try again.'
      });
    }

    // Store refresh token
    try {
      if (user.addRefreshToken) {
        await user.addRefreshToken(refreshToken);
        console.log('✅ Refresh token stored in user profile');
      } else {
        // Fallback: manually add to refreshTokens array
        if (!user.refreshTokens) {
          user.refreshTokens = [];
        }
        user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
        // Limit to 5 refresh tokens
        if (user.refreshTokens.length > 5) {
          user.refreshTokens.shift();
        }
        console.log('✅ Refresh token stored manually in user profile');
      }
    } catch (tokenStorageError) {
      console.error('⚠️ Error storing refresh token (non-critical):', tokenStorageError.message);
      // Don't fail login if token storage fails
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log('✅ Last login updated');

    console.log('✅ ========== LOGIN SUCCESSFUL ==========');
    console.log('👤 User:', user.email, 'Role:', user.role);
    console.log('🔑 Sending response with tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    const responseData = {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSpecificId,
          lastLogin: user.lastLogin
        }
      }
    };
    
    console.log('📤 Response data structure:', {
      success: responseData.success,
      hasData: !!responseData.data,
      hasAccessToken: !!responseData.data.accessToken,
      hasRefreshToken: !!responseData.data.refreshToken,
      hasUser: !!responseData.data.user,
      accessTokenType: typeof responseData.data.accessToken,
      accessTokenLength: responseData.data.accessToken ? responseData.data.accessToken.length : 0,
      refreshTokenType: typeof responseData.data.refreshToken,
      refreshTokenLength: responseData.data.refreshToken ? responseData.data.refreshToken.length : 0
    });
    
    // Log the actual token values (first 20 chars only for security)
    if (responseData.data.accessToken) {
      console.log('🔑 Access token preview:', responseData.data.accessToken.substring(0, 20) + '...');
    } else {
      console.error('❌ Access token is missing in responseData!');
    }
    if (responseData.data.refreshToken) {
      console.log('🔑 Refresh token preview:', responseData.data.refreshToken.substring(0, 20) + '...');
    } else {
      console.error('❌ Refresh token is missing in responseData!');
    }

    res.json(responseData);
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Please login again.'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        code: 'INVALID_USER'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'TOKEN_NOT_FOUND',
        message: 'This refresh token is no longer valid. Please login again.'
      });
    }

    // Get role-specific ID
    let roleSpecificId = '';
    try {
      switch (user.role) {
        case 'patient':
          const patient = await Patient.findOne({ userId: user._id });
          roleSpecificId = patient ? patient.patientId : '';
          break;
        case 'doctor':
          const doctor = await Doctor.findOne({ userId: user._id });
          roleSpecificId = doctor ? doctor.doctorId : '';
          break;
        case 'hospital':
          roleSpecificId = generateHospitalId();
          break;
      }
    } catch (profileError) {
      console.error('⚠️ Error fetching profile for refresh:', profileError);
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      roleSpecificId
    });

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token. Please try again.'
    });
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    } else {
      // Remove all refresh tokens
      user.refreshTokens = [];
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout.'
    });
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get role-specific ID
    let roleSpecificId = '';
    try {
      switch (user.role) {
        case 'patient':
          const patient = await Patient.findOne({ userId: user._id });
          roleSpecificId = patient ? patient.patientId : '';
          break;
        case 'doctor':
          const doctor = await Doctor.findOne({ userId: user._id });
          roleSpecificId = doctor ? doctor.doctorId : '';
          break;
      }
    } catch (profileError) {
      console.error('⚠️ Error fetching profile:', profileError);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSpecificId,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: 'An error occurred while fetching user data.'
    });
  }
});

module.exports = router;
