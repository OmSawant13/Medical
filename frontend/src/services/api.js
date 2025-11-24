import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle specific error codes
    switch (status) {
      case 401:
        // Unauthorized - Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
        toast.error(data?.message || 'Session expired. Please login again.');
        break;
      
      case 403:
        toast.error(data?.message || 'Access denied');
        break;
      
      case 404:
        toast.error(data?.message || 'Resource not found');
        break;
      
      case 422:
        // Validation errors
        if (data?.errors && Array.isArray(data.errors)) {
          const firstError = data.errors[0];
          toast.error(firstError?.msg || firstError?.message || 'Validation error');
        } else {
          toast.error(data?.message || 'Validation error');
        }
        break;
      
      case 500:
        toast.error(data?.message || 'Server error. Please try again later.');
        break;
      
      default:
        toast.error(data?.message || 'An error occurred');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Patient API
export const patientAPI = {
  getDashboard: () => api.get('/patients/dashboard'),
  getProfile: (patientId) => api.get(`/patients/${patientId}`),
  getHistory: (patientId) => api.get(`/patients/${patientId}/history`),
  updateProfile: (data) => api.patch('/patients/profile', data)
};

// Doctor API
export const doctorAPI = {
  getDashboard: () => api.get('/doctors/dashboard'),
  getPatientView: (patientId) => api.get(`/doctors/patient/${patientId}`),
  referPatient: (data) => api.post('/doctors/refer', data),
  searchDoctors: (params) => api.get('/doctors/search', { params }),
  getOne: (doctorId) => api.get(`/doctors/${doctorId}`)
};

// Hospital API
export const hospitalAPI = {
  lookupPatient: (patientId) => api.get(`/hospitals/patient/${patientId}`),
  searchHospitals: (params) => api.get('/hospitals/search', { params }),
  getNearby: (latitude, longitude, radius = 50, limit = 20) => 
    api.get('/hospitals/nearby', { 
      params: { latitude, longitude, radius, limit } 
    }),
  getDoctors: (hospitalId) => api.get(`/hospitals/${hospitalId}/doctors`)
};

// Appointment API
export const appointmentAPI = {
  create: (data) => api.post('/appointments', data),
  getAll: () => api.get('/appointments'),
  getOne: (appointmentId) => api.get(`/appointments/${appointmentId}`),
  scanQR: (appointmentId, qrCode) => {
    // Extract appointment ID from QR code if not provided
    let aptId = appointmentId;
    if (!aptId && qrCode) {
      try {
        const qrData = JSON.parse(qrCode);
        aptId = qrData.appointment_id;
      } catch (e) {
        // Use appointmentId as is
      }
    }
    return api.post(`/appointments/${aptId}/scan`, { qr_code: qrCode });
  },
  updateStatus: (appointmentId, status) => api.patch(`/appointments/${appointmentId}/status`, { status }),
  cancel: (appointmentId) => api.patch(`/appointments/${appointmentId}/cancel`),
  reschedule: (appointmentId, dateTime) => api.patch(`/appointments/${appointmentId}/reschedule`, { date_time: dateTime })
};

// Medical Records API
export const medicalRecordsAPI = {
  upload: (formData) => api.post('/medical-records', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  getOne: (recordId) => api.get(`/medical-records/${recordId}`)
};

// Family History API
export const familyHistoryAPI = {
  get: (patientId) => api.get(`/family-history/${patientId}`),
  link: (data) => api.post('/family-history/link', data)
};

// QR API
export const qrAPI = {
  getQR: (appointmentId) => api.get(`/qr/${appointmentId}`)
};

// AI API
export const aiAPI = {
  analyzeReport: (recordId) => api.post('/ai/analyze-report', { record_id: recordId }),
  summarizeHealth: () => api.post('/ai/summarize-health')
};

// Access Logs API
export const accessLogsAPI = {
  getAll: () => api.get('/access-logs'),
  getByPatient: (patientId) => api.get(`/access-logs/${patientId}`)
};

// Share History API
export const shareHistoryAPI = {
  create: (doctorId, durationHours) => api.post('/share-history/create', { doctor_id: doctorId, duration_hours: durationHours }),
  getByToken: (token) => api.get(`/share-history/${token}`),
  getAll: () => api.get('/share-history'),
  revoke: (shareId) => api.delete(`/share-history/${shareId}`)
};

// Follow-ups API
export const followUpsAPI = {
  create: (data) => api.post('/follow-ups', data),
  getDoctorFollowUps: () => api.get('/follow-ups/doctor'),
  getPatientFollowUps: () => api.get('/follow-ups/patient'),
  updateStatus: (followupId, status) => api.patch(`/follow-ups/${followupId}/status`, { status })
};

// Long-Term Patients API
export const longTermPatientsAPI = {
  add: (data) => api.post('/long-term-patients', data),
  getAll: (params) => api.get('/long-term-patients', { params }),
  getOne: (longtermId) => api.get(`/long-term-patients/${longtermId}`),
  addNote: (longtermId, note) => api.post(`/long-term-patients/${longtermId}/notes`, { note }),
  updateStatus: (longtermId, status) => api.patch(`/long-term-patients/${longtermId}/status`, { status })
};

export default api;

