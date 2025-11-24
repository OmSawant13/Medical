/**
 * Reusable Validation Functions
 * Centralized validation logic for consistency
 */

const { body } = require('express-validator');
const { ROLES, RECORD_TYPES, CHECK_FREQUENCY, LONG_TERM_STATUS } = require('./constants');

/**
 * User registration validation
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value')
];

/**
 * Login validation
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Appointment creation validation
 */
const validateAppointment = [
  body('doctor_id')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .matches(/^DOC-[\w-]+$/)
    .withMessage('Invalid doctor ID format'),
  
  body('date_time')
    .notEmpty()
    .withMessage('Date and time is required')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      if (date < new Date()) {
        throw new Error('Appointment date must be in the future');
      }
      return true;
    }),
  
  body('symptoms')
    .trim()
    .notEmpty()
    .withMessage('Symptoms are required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Symptoms must be between 10 and 1000 characters')
];

/**
 * Medical record validation
 */
const validateMedicalRecord = [
  body('patient_id')
    .notEmpty()
    .withMessage('Patient ID is required')
    .matches(/^PAT-[\w-]+$/)
    .withMessage('Invalid patient ID format'),
  
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Summary must not exceed 5000 characters'),
  
  body('record_type')
    .optional()
    .isIn(Object.values(RECORD_TYPES))
    .withMessage(`Record type must be one of: ${Object.values(RECORD_TYPES).join(', ')}`)
];

/**
 * Long-term patient validation
 */
const validateLongTermPatient = [
  body('patient_id')
    .notEmpty()
    .withMessage('Patient ID is required'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  
  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Diagnosis must not exceed 200 characters'),
  
  body('check_frequency')
    .optional()
    .isIn(Object.values(CHECK_FREQUENCY))
    .withMessage(`Check frequency must be one of: ${Object.values(CHECK_FREQUENCY).join(', ')}`)
];

/**
 * Share history validation
 */
const validateShareHistory = [
  body('doctor_id')
    .notEmpty()
    .withMessage('Doctor ID is required'),
  
  body('duration_hours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Duration must be between 1 and 168 hours (7 days)')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateAppointment,
  validateMedicalRecord,
  validateLongTermPatient,
  validateShareHistory
};

