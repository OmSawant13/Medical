const API_BASE_URL = 'http://localhost:5001/api';

// API utility functions
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  console.log('🔍 Making API request to:', API_BASE_URL + endpoint);

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    console.log('📡 API Response:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ API request failed:', error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  login: (email: string, password: string, role: string) => {
    console.log('🔐 Attempting login for:', email, role);
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  register: (userData: any) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),
};

// Patient APIs
export const patientAPI = {
  getProfile: () => apiRequest('/patient/profile'),
  updateProfile: (data: any) => apiRequest('/patient/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getAppointments: () => apiRequest('/patient/appointments'),
  bookAppointment: (appointmentData: any) => apiRequest('/patient/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  }),

  getMedicalHistory: () => apiRequest('/patient/medical-history'),
  getScans: () => apiRequest('/patient/scans'),

  getNotifications: () => apiRequest('/patient/notifications'),
  markNotificationRead: (notificationId: string) => apiRequest(`/patient/notifications/${notificationId}/read`, {
    method: 'PUT',
  }),

  logout: () => authAPI.logout(),
};

// Doctor APIs
export const doctorAPI = {
  getProfile: () => apiRequest('/doctor/profile'),
  updateProfile: (data: any) => apiRequest('/doctor/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getPendingScans: () => apiRequest('/doctor/pending-scans'),
  reviewScan: (scanId: string, reviewData: any) => apiRequest(`/doctor/scans/${scanId}/review`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  }),

  getPatients: () => apiRequest('/doctor/patients'),
  getPatientDetails: (patientId: string) => apiRequest(`/doctor/patients/${patientId}`),
  updatePatientRecord: (patientId: string, data: any) => apiRequest(`/doctor/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getPatientQueue: () => apiRequest('/doctor/patient-queue'),
  getReports: () => apiRequest('/doctor/reports'),

  logout: () => authAPI.logout(),
};

// Hospital APIs
export const hospitalAPI = {
  getProfile: () => apiRequest('/hospital/profile'),
  updateProfile: (data: any) => apiRequest('/hospital/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  uploadScan: (formData: FormData) => apiRequest('/hospital/upload-scan', {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  }),

  getUploadHistory: () => apiRequest('/hospital/uploads'),
  getSystemMetrics: () => apiRequest('/hospital/metrics'),
  getAnalytics: () => apiRequest('/hospital/analytics'),

  logout: () => authAPI.logout(),
};

// Default export object
const apiServices = { authAPI, patientAPI, doctorAPI, hospitalAPI };

export default apiServices;
