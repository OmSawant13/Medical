import { body, param, query, ValidationChain } from 'express-validator';

export const validatePatientRegistration: ValidationChain[] = [
  body('name').notEmpty().withMessage('Name is required').isLength({ min: 2 }),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('personalInfo.phone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('personalInfo.dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('personalInfo.gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required')
];

export const validateDoctorRegistration: ValidationChain[] = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('specialization').isArray().withMessage('Specialization must be an array'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a non-negative integer')
];

export const validateScanUpload: ValidationChain[] = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('scanType').isIn(['chest-xray', 'brain-mri', 'bone-xray', 'ct-scan', 'ultrasound']).withMessage('Valid scan type is required')
];

export const validateAppointment: ValidationChain[] = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('type').isIn(['consultation', 'follow-up', 'emergency', 'video-call']).withMessage('Valid appointment type is required')
];
