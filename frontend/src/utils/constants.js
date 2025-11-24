/**
 * Frontend Constants
 * Centralized constants for better maintainability
 */

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  PATIENT_HISTORY: '/patient/history',
  PATIENT_SEARCH_DOCTORS: '/patient/search-doctors',
  PATIENT_NEARBY_HOSPITALS: '/patient/nearby-hospitals',
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_LONG_TERM: '/doctor/long-term-patients',
  HOSPITAL_DASHBOARD: '/hospital/dashboard'
};

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  HOSPITAL: 'hospital'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const RECORD_TYPES = {
  PRESCRIPTION: 'prescription',
  LAB_TEST: 'lab_test',
  XRAY: 'xray',
  DISCHARGE_SUMMARY: 'discharge_summary',
  OTHER: 'other'
};

export const STATUS_COLORS = {
  pending: 'warning',
  accepted: 'info',
  completed: 'success',
  cancelled: 'danger'
};

export const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const DATE_FORMATS = {
  DISPLAY: 'PPpp', // Dec 25, 2024, 10:30 AM
  DATE_ONLY: 'PP', // Dec 25, 2024
  TIME_ONLY: 'pp', // 10:30 AM
  SHORT: 'MMM dd, yyyy' // Dec 25, 2024
};

export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
  DOCUMENT: ['pdf', 'doc', 'docx'],
  ALL: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf', 'doc', 'docx']
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 3000,
  WARNING: 4000
};

