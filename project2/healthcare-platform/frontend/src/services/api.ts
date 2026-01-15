const API_BASE_URL = 'http://localhost:5001/api';

// Token management
const TOKEN_STORAGE_KEY = 'accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

// Get stored tokens
const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token'); // Backward compatibility
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || localStorage.getItem('refreshToken');
};

// Store tokens
const storeTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  // Also store for backward compatibility
  localStorage.setItem('token', accessToken);
  localStorage.setItem('authToken', accessToken);
};

// Clear tokens
const clearTokens = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem('userRole');
};

// Refresh access token
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        console.warn('⚠️ No refresh token found');
        clearTokens();
        return null;
      }

      console.log('🔄 Refreshing access token...');

      const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Token refresh failed:', errorData);
        clearTokens();
        window.location.href = '/login?expired=true';
        return null;
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data.data || data;

      if (!accessToken) {
        console.error('❌ No access token in refresh response');
        clearTokens();
        return null;
      }

      // Store new tokens
      if (newRefreshToken) {
        storeTokens(accessToken, newRefreshToken);
      } else {
        localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        localStorage.setItem('token', accessToken);
      }

      console.log('✅ Access token refreshed');
      return accessToken;
    } catch (error: any) {
      console.error('❌ Error refreshing token:', error);
      clearTokens();
      window.location.href = '/login?expired=true';
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// API request with automatic token refresh
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  let token = getAccessToken();

  const makeRequest = async (accessToken: string | null): Promise<any> => {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If access token expired, try to refresh
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));

      if (errorData.code === 'ACCESS_TOKEN_EXPIRED' || errorData.error?.includes('expired')) {
        console.log('🔄 Access token expired, refreshing...');

        const newToken = await refreshAccessToken();

        if (newToken) {
          // Retry request with new token
          return makeRequest(newToken);
        } else {
          // Refresh failed, redirect to login
          throw new Error('Session expired. Please login again.');
        }
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorCode = '';

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorCode = errorData.code || '';

        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        }

        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`;
        }
      } catch (e) {
        errorMessage = `${response.status} ${response.statusText}`;
      }

      const error = new Error(errorMessage) as any;
      error.code = errorCode;
      error.status = response.status;

      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        if (errorCode === 'INVALID_ACCESS_TOKEN' ||
          errorCode === 'INVALID_REFRESH_TOKEN' ||
          errorMessage.includes('Invalid') ||
          errorMessage.includes('token')) {
          console.warn('⚠️ Invalid token, clearing storage');
          clearTokens();
          error.shouldRedirect = true;
        }
      }

      throw error;
    }

    return response.json();
  };

  return makeRequest(token);
};

// Authentication APIs
export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    console.log('🔐 ========== FRONTEND LOGIN START ==========');
    console.log('📧 Login attempt:', { email, role, passwordLength: password ? password.length : 0 });

    // Login doesn't require token, so use direct fetch
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      console.log('📡 Login response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Login failed:', {
          status: response.status,
          error: errorData.error,
          message: errorData.message,
          errors: errorData.errors
        });

        const error = new Error(errorData.message || errorData.error || 'Login failed') as any;
        error.code = errorData.code;
        error.status = response.status;
        if (errorData.errors) {
          error.errors = errorData.errors;
          error.message = errorData.errors.join(', ') || error.message;
        }
        throw error;
      }

      const data = await response.json();
      console.log('✅ Login response received:', {
        success: data.success,
        hasData: !!data.data,
        hasAccessToken: !!data.data?.accessToken,
        hasRefreshToken: !!data.data?.refreshToken,
        hasUser: !!data.data?.user
      });
      console.log('📋 Full response data:', JSON.stringify(data, null, 2));
      console.log('📋 data.data keys:', data.data ? Object.keys(data.data) : 'no data');
      console.log('📋 accessToken type:', typeof data.data?.accessToken, 'value:', data.data?.accessToken);
      console.log('📋 refreshToken type:', typeof data.data?.refreshToken, 'value:', data.data?.refreshToken);

      // Store tokens
      if (data.data) {
        const { accessToken, refreshToken, user } = data.data;
        console.log('🔍 Extracted tokens:', {
          accessTokenType: typeof accessToken,
          accessTokenLength: accessToken ? accessToken.length : 0,
          refreshTokenType: typeof refreshToken,
          refreshTokenLength: refreshToken ? refreshToken.length : 0,
          hasUser: !!user
        });

        if (accessToken && refreshToken) {
          console.log('💾 Storing tokens after login...');
          storeTokens(accessToken, refreshToken);
          if (user) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
            localStorage.setItem('userRole', user.role);
          }

          // Verify storage
          const storedAccessToken = localStorage.getItem('accessToken');
          const storedRefreshToken = localStorage.getItem('refreshToken');
          const storedToken = localStorage.getItem('token');
          const storedUserData = localStorage.getItem('userData');

          console.log('✅ Tokens stored verification:', {
            accessToken: !!storedAccessToken,
            refreshToken: !!storedRefreshToken,
            token: !!storedToken,
            userData: !!storedUserData,
            accessTokenLength: storedAccessToken ? storedAccessToken.length : 0
          });

          if (!storedAccessToken && !storedToken) {
            console.error('❌ CRITICAL: Tokens not stored in localStorage!');
            throw new Error('Failed to store authentication tokens. Please check browser settings.');
          }
        } else {
          console.error('❌ No tokens in login response data:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            fullData: data.data
          });
          throw new Error('Login response missing tokens. Please try again.');
        }
      } else {
        console.error('❌ No data in login response:', data);
        throw new Error('Invalid login response format. Please try again.');
      }

      console.log('✅ ========== FRONTEND LOGIN SUCCESS ==========');
      return data;
    } catch (error: any) {
      console.error('❌ ========== FRONTEND LOGIN ERROR ==========');
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors
      });
      throw error;
    }
  },

  register: async (userData: any) => {
    // Register doesn't require token, so use direct fetch
    const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || errorData.message || 'Registration failed') as any;
      error.code = errorData.code;
      error.status = response.status;
      if (errorData.errors) {
        error.errors = errorData.errors;
      }
      throw error;
    }

    const data = await response.json();

    // Store tokens
    if (data.data) {
      const { accessToken, refreshToken, user } = data.data;
      if (accessToken && refreshToken) {
        storeTokens(accessToken, refreshToken);
        if (user) {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
          localStorage.setItem('userRole', user.role);
        }
      }
    }

    return data;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiRequest('/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  },

  refreshToken: refreshAccessToken,

  getCurrentUser: () => apiRequest('/v1/auth/me'),
};

// Patient APIs
export const patientAPI = {
  getProfile: () => apiRequest('/v1/patients/profile'),
  updateProfile: (data: any) => apiRequest('/v1/patients/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getAppointments: () => apiRequest('/v1/appointments'),
  bookAppointment: (appointmentData: any) => apiRequest('/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  }),
  cancelAppointment: (appointmentId: string, reason?: string) => apiRequest(`/v1/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  }),

  getMedicalHistory: () => apiRequest('/v1/patients/medical-history'),
  getScans: () => apiRequest('/v1/patients/scans'),
  getPrescriptions: () => apiRequest('/v1/prescriptions/patient'),
  uploadScan: async (file: File, scanType: string) => {
    const formData = new FormData();
    formData.append('scan', file);
    formData.append('scanType', scanType);

    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/v1/patients/scans/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Failed to upload scan');
    }

    return response.json();
  },

  getNotifications: () => apiRequest('/v1/patients/notifications'),
  markNotificationRead: (notificationId: string) => apiRequest(`/patient/notifications/${notificationId}/read`, {
    method: 'PUT',
  }),

  // Hospital and doctor search
  getHospitals: (params?: { latitude?: number; longitude?: number; radius?: number; city?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.latitude) queryParams.append('latitude', params.latitude.toString());
    if (params?.longitude) queryParams.append('longitude', params.longitude.toString());
    if (params?.radius) queryParams.append('radius', params.radius.toString());
    if (params?.city) queryParams.append('city', params.city);
    if (params?.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return apiRequest(`/v1/hospitals${query ? '?' + query : ''}`);
  },

  getDoctorsByHospital: (hospitalId: string, hospitalName?: string) => {
    const url = `/v1/hospitals/${hospitalId}/doctors`;
    const query = hospitalName ? `?hospitalName=${encodeURIComponent(hospitalName)}` : '';
    return apiRequest(url + query);
  },

  getDoctorDetails: (doctorId: string) =>
    apiRequest(`/v1/doctors/${doctorId}`),
};

// Doctor APIs
export const doctorAPI = {
  getPendingScans: () => apiRequest('/v1/doctors/pending-scans'),
  getPatientQueue: () => apiRequest('/v1/doctors/patient-queue'),
  getPatients: () => apiRequest('/v1/doctors/patients'),
  getProfile: () => apiRequest('/v1/doctors/profile'),
  updateProfile: (data: any) => apiRequest('/v1/doctors/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getAppointments: () => apiRequest('/v1/appointments'),
  updateAppointmentStatus: (appointmentId: string, data: { status: string; notes?: string; diagnosis?: string; prescription?: string[] }) =>
    apiRequest(`/v1/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateScanReview: (scanId: string, data: any) => apiRequest(`/v1/doctors/scans/${scanId}/review`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getNotifications: () => apiRequest('/v1/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/v1/notifications/${id}/read`, {
    method: 'PUT'
  }),
  markAllNotificationsRead: () => apiRequest('/v1/notifications/read-all', {
    method: 'PUT'
  }),
  updatePatientLongTermStatus: (patientId: string, isLongTerm: boolean) => apiRequest(`/v1/patients/${patientId}/long-term`, {
    method: 'PUT',
    body: JSON.stringify({ isLongTerm })
  })
};

// Export token management functions
export { getAccessToken, getRefreshToken, storeTokens, clearTokens };
