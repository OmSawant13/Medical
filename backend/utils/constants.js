/**
 * Application Constants
 * Centralized constants for better maintainability
 */

module.exports = {
  // User Roles
  ROLES: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    HOSPITAL: 'hospital'
  },

  // Appointment Status
  APPOINTMENT_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Record Types
  RECORD_TYPES: {
    PRESCRIPTION: 'prescription',
    LAB_TEST: 'lab_test',
    XRAY: 'xray',
    DISCHARGE_SUMMARY: 'discharge_summary',
    OTHER: 'other'
  },

  // Long-Term Patient Status
  LONG_TERM_STATUS: {
    ACTIVE: 'active',
    MONITORING: 'monitoring',
    RECOVERED: 'recovered',
    DISCHARGED: 'discharged'
  },

  // Check Frequencies
  CHECK_FREQUENCY: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    BI_WEEKLY: 'bi-weekly',
    MONTHLY: 'monthly'
  },

  // Follow-Up Status
  FOLLOW_UP_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // File Upload Limits
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['jpeg', 'jpg', 'png', 'pdf', 'doc', 'docx'],
    MAX_FILES: 10
  },

  // QR Code
  QR_CODE: {
    EXPIRY_HOURS: 24 // Hours after appointment
  },

  // Share Link
  SHARE_LINK: {
    DEFAULT_DURATION_HOURS: 24,
    MIN_DURATION_HOURS: 1,
    MAX_DURATION_HOURS: 168 // 7 days
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // Error Messages
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation failed',
    SERVER_ERROR: 'Internal server error',
    INVALID_TOKEN: 'Invalid or expired token',
    USER_NOT_FOUND: 'User not found',
    PATIENT_NOT_FOUND: 'Patient not found',
    DOCTOR_NOT_FOUND: 'Doctor not found',
    HOSPITAL_NOT_FOUND: 'Hospital not found',
    APPOINTMENT_NOT_FOUND: 'Appointment not found',
    RECORD_NOT_FOUND: 'Medical record not found',
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type',
    ACCOUNT_NOT_VERIFIED: 'Account pending verification'
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    REGISTER_SUCCESS: 'Registration successful',
    APPOINTMENT_BOOKED: 'Appointment booked successfully',
    APPOINTMENT_CANCELLED: 'Appointment cancelled successfully',
    RECORD_UPLOADED: 'Medical record uploaded successfully',
    ANALYSIS_COMPLETE: 'AI analysis completed successfully'
  }
};

