import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { patientAPI, authAPI } from '../services/api';
import { generateMedicalReportPDF, generateMedicalReportPDFBlobUrl } from '../utils/pdfGenerator';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import AppointmentCard from '../components/dashboard/AppointmentCard';
import ScanCard from '../components/dashboard/ScanCard';

interface MedicalScan {
  _id: string;
  scanType: string;
  uploadDate: string;
  status: 'uploaded' | 'processing' | 'analysis_complete' | 'doctor_reviewed';
  aiResults?: {
    confidence: number;
    findings: string[];
    recommendations: string[];
  };
}

interface Appointment {
  _id: string;
  appointmentId?: string;
  doctorName: string;
  doctorId?: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'in-progress';
  qrCode?: string;
  meetingLink?: string;
  symptoms?: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  appointmentId: string;
  doctorName?: string;
  diagnosis?: string;
  notes?: string;
  imagePrescription?: {
    filePath: string;
    fileName: string;
  };
  digitalPrescription?: {
    medicines: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    diagnosis: string;
    notes: string;
    followUpDate?: string | Date;
  };
  createdAt: string;
}

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string[];
  medications: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointmentReminders: boolean;
    scanResults: boolean;
    medicationReminders: boolean;
  };
  privacy: {
    shareDataWithDoctors: boolean;
    shareDataForResearch: boolean;
    allowMarketingEmails: boolean;
  };
}



const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [scans, setScans] = useState<MedicalScan[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState<Appointment | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [showNewAppointmentQR, setShowNewAppointmentQR] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // MVP Booking Flow States
  const [bookingStep, setBookingStep] = useState(1); // 1: Hospitals, 2: Doctors, 3: Schedule, 4: Confirm
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(5); // Default 5km (hos style)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    bloodType: 'O+',
    allergies: [],
    medications: [],
    notifications: {
      email: true,
      sms: true,
      push: true,
      appointmentReminders: true,
      scanResults: true,
      medicationReminders: true
    },
    privacy: {
      shareDataWithDoctors: true,
      shareDataForResearch: false,
      allowMarketingEmails: false
    }
  });
  const [bookingForm, setBookingForm] = useState({
    hospitalId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    symptoms: ''
  });

  const loadUserData = useCallback(async () => {
    try {
      // Check token before making any API calls
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No token found before API calls, redirecting to login');
        localStorage.clear();
        window.location.href = '/login?role=patient&expired=true';
        return;
      }

      setLoading(true);

      // Load all patient data in parallel
      const [profileResponse, appointmentsResponse, scansResponse, prescriptionsResponse, notificationsResponse] = await Promise.all([
        patientAPI.getProfile().catch(err => {
          console.error('Profile fetch error:', err);
          // If token error, don't continue with other calls
          if (err.code === 'TOKEN_EXPIRED' || err.code === 'INVALID_TOKEN' || err.shouldRedirect) {
            throw err; // Re-throw to stop other calls
          }
          return null;
        }),
        patientAPI.getAppointments().catch(err => {
          if (err.code === 'TOKEN_EXPIRED' || err.code === 'INVALID_TOKEN' || err.shouldRedirect) {
            throw err;
          }
          return [];
        }),
        patientAPI.getScans().catch(err => {
          if (err.code === 'TOKEN_EXPIRED' || err.code === 'INVALID_TOKEN' || err.shouldRedirect) {
            throw err;
          }
          return [];
        }),
        patientAPI.getPrescriptions().catch((err: any) => {
          if (err.code === 'TOKEN_EXPIRED' || err.code === 'INVALID_TOKEN' || err.shouldRedirect) {
            throw err;
          }
          return [];
        }),
        patientAPI.getNotifications().catch(err => {
          if (err.code === 'TOKEN_EXPIRED' || err.code === 'INVALID_TOKEN' || err.shouldRedirect) {
            throw err;
          }
          return [];
        }),
      ]);

      // Handle profile data - check if it's wrapped in success/data
      let profileData = profileResponse;
      if (profileResponse && profileResponse.success) {
        profileData = profileResponse.data || profileResponse;
      }

      // Use profile data from API, fallback to localStorage if API fails
      if (profileData && profileData.name) {
        setUser(profileData);
        // Also update localStorage with fresh data
        localStorage.setItem('userData', JSON.stringify(profileData));
      } else {
        // Fallback to localStorage user data
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      }

      // Handle appointments - check if wrapped in array or response object
      const rawAppointments = Array.isArray(appointmentsResponse)
        ? appointmentsResponse
        : (appointmentsResponse?.data || appointmentsResponse?.appointments || []);

      // Transform backend appointment format to frontend format
      const transformedAppointments = await Promise.all(
        rawAppointments.map(async (apt: any) => {
          // If already in frontend format, return as is
          if (apt.doctorName && apt.date) {
            return apt;
          }

          // Transform backend format to frontend format
          // First check if doctorDetails is already populated from backend
          let doctorName = apt.doctorDetails?.name || apt.doctorName || 'Doctor';

          // If still not found, try to fetch from API
          if ((!doctorName || doctorName === 'Doctor') && apt.doctorId) {
            try {
              // Try to get doctor details
              const doctorResponse = await patientAPI.getDoctorDetails(apt.doctorId);
              const doctorData = doctorResponse?.data || doctorResponse;
              doctorName = doctorData?.name || doctorData?.userId?.name || 'Doctor';
            } catch (err) {
              console.warn('Could not fetch doctor details:', err);
            }
          }

          return {
            _id: apt.appointmentId || apt._id,
            appointmentId: apt.appointmentId,
            doctorName: doctorName,
            doctorId: apt.doctorId,
            date: apt.appointmentDate || apt.date,
            time: apt.appointmentTime || apt.time,
            type: apt.type || 'consultation',
            status: apt.status || 'scheduled',
            qrCode: apt.qrCode,
            meetingLink: apt.meetingLink,
            symptoms: Array.isArray(apt.symptoms) ? apt.symptoms.join(', ') : (apt.symptoms || '')
          };
        })
      );

      setAppointments(transformedAppointments);

      // Handle prescriptions - check if wrapped in array or response object
      const prescriptionsData = Array.isArray(prescriptionsResponse)
        ? prescriptionsResponse
        : (prescriptionsResponse?.data || prescriptionsResponse?.prescriptions || []);
      console.log('📋 Loaded prescriptions:', prescriptionsData.length);
      prescriptionsData.forEach((p: any) => {
        console.log('  - Prescription:', {
          prescriptionId: p.prescriptionId,
          appointmentId: p.appointmentId,
          hasDigital: !!p.digitalPrescription,
          hasImage: !!p.imagePrescription,
          diagnosis: p.diagnosis || p.digitalPrescription?.diagnosis || 'N/A',
          notes: (p.notes || p.digitalPrescription?.notes || '').substring(0, 30) + '...',
          medicinesCount: p.digitalPrescription?.medicines?.length || 0
        });
      });
      setPrescriptions(prescriptionsData);

      // Handle scans - check if wrapped in array or response object
      const scansData = Array.isArray(scansResponse)
        ? scansResponse
        : (scansResponse?.data || scansResponse?.scans || []);
      setScans(scansData);

      // Handle notifications - check if wrapped in array or response object
      const notificationsData = Array.isArray(notificationsResponse)
        ? notificationsResponse
        : (notificationsResponse?.data || notificationsResponse?.notifications || []);
      setNotifications(notificationsData);

      // Update user settings with real data from profile
      if (profileData) {
        const personalInfo = profileData.personalInfo || {};
        setUserSettings(prev => ({
          ...prev,
          name: profileData.name || personalInfo.name || '',
          email: profileData.email || '',
          phone: personalInfo.phone || '',
          dateOfBirth: personalInfo.dateOfBirth || '',
          address: personalInfo.address || '',
          emergencyContact: personalInfo.emergencyContact || '',
          bloodType: personalInfo.bloodType || 'O+',
          allergies: personalInfo.allergies || [],
          medications: personalInfo.medications || [],
          notifications: profileData.notifications || prev.notifications,
          privacy: profileData.privacy || prev.privacy,
        }));
      }

    } catch (error: any) {
      console.error('Error loading user data:', error);

      // Check for token expiration or invalid token
      const errorMessage = error.message || '';
      const errorCode = error.code || '';
      const isTokenExpired = errorMessage.includes('expired') ||
        errorMessage.includes('TOKEN_EXPIRED') ||
        errorCode === 'TOKEN_EXPIRED';
      const isInvalidToken = errorMessage.includes('Invalid') ||
        errorMessage.includes('INVALID_TOKEN') ||
        errorCode === 'INVALID_TOKEN' ||
        error.status === 403;

      if (isTokenExpired || isInvalidToken || (error as any).shouldRedirect) {
        // Token expired or invalid - clear storage and redirect to login
        console.warn('⚠️ Token expired or invalid, redirecting to login');
        localStorage.clear();
        // Use window.location for hard redirect (ensures full page reload)
        window.location.href = '/login?role=patient';
        return;
      }

      // Other auth errors (401/403)
      const isAuthError = error.status === 401 || error.status === 403 ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('token') ||
        errorMessage.includes('Authentication');

      if (isAuthError) {
        // Any auth error - redirect to login immediately
        console.warn('⚠️ Auth error detected, redirecting to login');
        localStorage.clear();
        window.location.href = '/login?role=patient&expired=true';
        return;
      } else {
        // Non-auth error - just show error message
        setError('Failed to load some data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  }, [/* navigate removed (not used) */]);

  // Load nearby hospitals - MUST be defined before getUserLocation
  const loadHospitals = useCallback(async (lat?: number, lon?: number, city?: string) => {
    // Declare cityToSearch outside try block so it's available in catch block
    const cityToSearch = city || searchCity;

    try {
      setLoadingHospitals(true);

      // Check token before making request
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No token found in localStorage');
        console.warn('⚠️ Token missing, redirecting to login');
        localStorage.clear();
        window.location.href = '/login?role=patient&expired=true';
        return;
      }
      console.log('🔑 Token found, length:', token.length);

      const params: any = {};

      // PRIORITY: Location-based search (EXACT hos behavior - location only, no city)
      if (lat && lon) {
        params.latitude = lat;
        params.longitude = lon;
        params.radius = radiusKm; // Use selected radius (1km, 2km, 3km, 5km)
        console.log('📍 Location-based search (hos style):', lat, lon, `radius: ${radiusKm}km`);
      } else {
        // Fallback: City search only if NO location available
        const cityToSearch = city || searchCity;
        if (cityToSearch && cityToSearch.trim()) {
          params.city = cityToSearch.trim();
          console.log('🏙️ City search (fallback, no location):', cityToSearch.trim());
        }
      }

      console.log('🔍 Loading hospitals with params:', params);
      console.log('🔍 City to search:', cityToSearch);

      try {
        const response = await patientAPI.getHospitals(params);
        console.log('📡 Hospitals API response:', response);
        console.log('📡 Response type:', typeof response);
        console.log('📡 Is array?', Array.isArray(response));
        console.log('📡 Full response:', JSON.stringify(response, null, 2).substring(0, 500));

        // Handle both response formats: { success: true, data: [...] } or direct array
        let hospitalsList: any[] = [];

        if (Array.isArray(response)) {
          hospitalsList = response;
          console.log('✅ Response is direct array');
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) {
            hospitalsList = response.data;
            console.log('✅ Response has data array');
          } else if (response.success && Array.isArray(response.data)) {
            hospitalsList = response.data;
            console.log('✅ Response has success and data array');
          } else {
            console.warn('⚠️ Unexpected response format:', response);
            console.warn('⚠️ Response keys:', Object.keys(response));
            hospitalsList = [];
          }
        } else {
          console.warn('⚠️ Unexpected response type:', typeof response);
          hospitalsList = [];
        }

        console.log('✅ Hospitals loaded:', hospitalsList.length);
        if (hospitalsList.length > 0) {
          console.log('🏥 Sample hospital:', {
            name: hospitalsList[0].hospitalName,
            city: hospitalsList[0].address?.city,
            distance: hospitalsList[0].distance
          });
        }

        if (hospitalsList.length === 0) {
          if (cityToSearch) {
            console.warn('⚠️ No hospitals found for city:', cityToSearch);
            alert(`No hospitals found in "${cityToSearch}". Try searching for Mumbai, Delhi, Bangalore, or Pune.`);
          } else {
            console.warn('⚠️ No hospitals found');
            alert('No hospitals found. Please try searching by city or allow location access.');
          }
        }

        setHospitals(hospitalsList);
      } catch (apiError: any) {
        console.error('❌ API Error in try block:', apiError);
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error('❌ Error loading hospitals:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error status:', (error as any).status);
      console.error('Error response:', (error as any).response);

      // Check for specific error codes
      const errorMessage = error.message || '';
      const errorCode = error.code || '';
      const isAuthError = error.status === 401 || error.status === 403 ||
        errorMessage.includes('Authentication') ||
        errorMessage.includes('token') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('TOKEN_EXPIRED') ||
        errorMessage.includes('INVALID_TOKEN') ||
        errorMessage.includes('NO_TOKEN') ||
        errorCode === 'TOKEN_EXPIRED' ||
        errorCode === 'INVALID_TOKEN' ||
        (error as any).shouldRedirect;

      if (isAuthError) {
        // Auth error - redirect immediately
        console.warn('⚠️ Authentication error detected, redirecting to login');
        localStorage.clear();
        window.location.href = '/login?role=patient&expired=true';
        return;
      }

      // If city search failed, try without city filter as fallback
      if (cityToSearch && cityToSearch.trim()) {
        console.log('🔄 City search failed, trying without city filter...');
        try {
          const fallbackParams: any = { radius: 20 };
          if (lat && lon) {
            fallbackParams.latitude = lat;
            fallbackParams.longitude = lon;
          }
          const fallbackResponse = await patientAPI.getHospitals(fallbackParams);
          const fallbackList = Array.isArray(fallbackResponse)
            ? fallbackResponse
            : (fallbackResponse?.data || []);

          if (fallbackList.length > 0) {
            console.log('✅ Fallback successful, loaded', fallbackList.length, 'hospitals');
            setHospitals(fallbackList);
            alert(`No hospitals found in "${cityToSearch}". Showing all available hospitals instead.`);
            return;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }

      setHospitals([]);
      alert(`Failed to load hospitals: ${errorMessage || 'Unknown error'}. Please check your connection and try again.`);
    } finally {
      setLoadingHospitals(false);
    }
  }, [radiusKm, searchCity]); // Add radiusKm to dependencies

  // Get user location for nearby hospitals
  const getUserLocation = useCallback(() => {
    console.log('📍 Requesting user location...');
    setLoadingHospitals(true);

    if (!navigator.geolocation) {
      console.error('❌ Geolocation is not supported by this browser');
      alert('📍 Location access is not supported by your browser. Please search by city instead.');
      setLoadingHospitals(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds timeout
      maximumAge: 0 // Don't use cached location
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Location fetched successfully:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy + ' meters'
        });

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setUserLocation(location);
        loadHospitals(location.latitude, location.longitude);
      },
      (error) => {
        console.error('❌ Error getting location:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setLoadingHospitals(false);

        let errorMessage = 'Failed to get your location. ';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '📍 Location access was denied. Please allow location access in your browser settings or search by city.';
            alert(errorMessage);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += '📍 Location information is unavailable. Please search by city.';
            alert(errorMessage);
            break;
          case error.TIMEOUT:
            errorMessage += '📍 Location request timed out. Please try again or search by city.';
            alert(errorMessage);
            break;
          default:
            errorMessage += 'Please search by city instead.';
            alert(errorMessage);
            break;
        }

        // Load hospitals without location (default to Mumbai)
        setUserLocation(null);
        loadHospitals();
      },
      options
    );
  }, [loadHospitals]);

  // Auto-fetch location when booking step 1 is active
  useEffect(() => {
    if (bookingStep === 1 && !userLocation && !loadingHospitals && hospitals.length === 0) {
      console.log('📍 Auto-fetching location for booking step 1');
      // Small delay to ensure UI is ready and browser can show permission prompt
      const timer = setTimeout(() => {
        getUserLocation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bookingStep, userLocation, loadingHospitals, hospitals.length, getUserLocation]);

  useEffect(() => {
    // Check if user is logged in - check for new token format first, then fallback to old
    const token = localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      console.warn('⚠️ No token or userData found, redirecting to login');
      console.warn('🔍 Token check:', {
        accessToken: !!localStorage.getItem('accessToken'),
        token: !!localStorage.getItem('token'),
        authToken: !!localStorage.getItem('authToken'),
        userData: !!userData
      });
      // Clear everything
      localStorage.clear();
      navigate('/login?role=patient');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Load real data from API
      loadUserData();
    } catch (error) {
      console.error('Error parsing userData:', error);
      // If userData is corrupted, clear it and redirect
      localStorage.clear();
      navigate('/login?role=patient');
    }
  }, [navigate, loadUserData]);

  const downloadReport = async () => {
    try {
      const reportData = {
        patientName: user?.name || 'Patient',
        patientId: user?.roleSpecificId || 'Unknown',
        reportDate: new Date().toISOString(),
        medicalHistory: scans,
        appointments: appointments,
        summary: {
          totalScans: scans.length,
          completedScans: scans.filter(s => s.status === 'doctor_reviewed').length,
          upcomingAppointments: appointments.filter(a => a.status !== 'completed').length
        }
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical_report_${user?.name || 'patient'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Medical report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('❌ Failed to download report');
    }
  };

  const downloadIndividualAppointmentReport = async (appointment: Appointment) => {
    // First, refresh prescriptions to get latest data
    let currentPrescriptions = prescriptions;
    try {
      const prescriptionsResponse = await patientAPI.getPrescriptions();
      const freshPrescriptions = Array.isArray(prescriptionsResponse)
        ? prescriptionsResponse
        : (prescriptionsResponse?.data || prescriptionsResponse?.prescriptions || []);
      setPrescriptions(freshPrescriptions);
      currentPrescriptions = freshPrescriptions; // Use fresh data
      console.log('🔄 Refreshed prescriptions before download:', freshPrescriptions.length);
    } catch (error) {
      console.error('Error refreshing prescriptions:', error);
    }

    // Try multiple matching strategies with fresh prescriptions
    const appointmentPrescription = currentPrescriptions.find(
      p => {
        const match1 = p.appointmentId === appointment.appointmentId;
        const match2 = p.appointmentId === appointment._id;
        const match3 = p.appointmentId === String(appointment.appointmentId);
        const match4 = p.appointmentId === String(appointment._id);
        return match1 || match2 || match3 || match4;
      }
    );

    console.log('🔍 Download Report Debug:', {
      appointmentId: appointment.appointmentId,
      appointment_id: appointment._id,
      totalPrescriptions: currentPrescriptions.length,
      foundPrescription: !!appointmentPrescription,
      prescriptionData: appointmentPrescription ? {
        prescriptionId: appointmentPrescription.prescriptionId,
        appointmentId: appointmentPrescription.appointmentId,
        hasDiagnosis: !!(appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis),
        hasNotes: !!(appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes),
        notesPreview: (appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes || '').substring(0, 100),
        hasMedicines: !!(appointmentPrescription.digitalPrescription?.medicines?.length),
        hasImage: !!appointmentPrescription.imagePrescription
      } : null
    });

    try {
      // Prepare prescription data for PDF
      let prescriptionData = null;
      let imageUrl: string | undefined = undefined;

      if (appointmentPrescription) {
        // Get image URL if available
        if (appointmentPrescription.imagePrescription?.filePath) {
          imageUrl = `http://localhost:5001${appointmentPrescription.imagePrescription.filePath}`;
        }

        // Get diagnosis (check both top level and digitalPrescription)
        const diagnosis = appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis || '';

        // Get notes (check both top level and digitalPrescription)
        const notes = appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes || '';

        // Get medicines
        const medicines = appointmentPrescription.digitalPrescription?.medicines || [];

        console.log('📋 Prescription Data for PDF:', {
          diagnosis,
          notes: notes.substring(0, 50) + '...',
          medicinesCount: medicines.length,
          hasImage: !!imageUrl
        });

        prescriptionData = {
          diagnosis: diagnosis,
          medicines: medicines,
          notes: notes,
          imageUrl: imageUrl
        };
      } else {
        console.warn('⚠️ No prescription found for appointment:', appointment.appointmentId);
        // Try to fetch prescription directly from API
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
          const response = await fetch(`http://localhost:5001/api/v1/prescriptions/patient`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          const allPrescriptions = data.data || data || [];
          console.log('📋 All prescriptions from API:', allPrescriptions.length);

          const foundPrescription = allPrescriptions.find((p: any) =>
            p.appointmentId === appointment.appointmentId ||
            p.appointmentId === appointment._id ||
            String(p.appointmentId) === String(appointment.appointmentId)
          );

          if (foundPrescription) {
            console.log('✅ Found prescription via API:', foundPrescription.prescriptionId);
            const diagnosis = foundPrescription.diagnosis || foundPrescription.digitalPrescription?.diagnosis || '';
            const notes = foundPrescription.notes || foundPrescription.digitalPrescription?.notes || '';
            const medicines = foundPrescription.digitalPrescription?.medicines || [];
            const imagePath = foundPrescription.imagePrescription?.filePath;

            prescriptionData = {
              diagnosis: diagnosis,
              medicines: medicines,
              notes: notes,
              imageUrl: imagePath ? `http://localhost:5001${imagePath}` : undefined
            };
          }
        } catch (err) {
          console.error('Error fetching prescription from API:', err);
        }
      }

      // Generate PDF
      await generateMedicalReportPDF(
        {
          appointmentId: appointment.appointmentId || appointment._id,
          doctorName: appointment.doctorName || 'N/A',
          date: appointment.date,
          time: appointment.time,
          type: appointment.type || 'consultation',
          symptoms: appointment.symptoms
        },
        prescriptionData,
        user?.name || 'Patient'
      );

      if (prescriptionData && (prescriptionData.diagnosis || prescriptionData.notes || prescriptionData.medicines?.length > 0)) {
        alert('✅ Medical report PDF downloaded successfully with prescription details!');
      } else {
        alert('⚠️ Medical report PDF downloaded, but no prescription data found. Please check if doctor has completed the consultation.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Failed to generate PDF report. Please try again.');
    }
  };


  // Load doctors by hospital
  const loadDoctors = async (hospitalId: string, hospitalName?: string) => {
    try {
      setLoadingDoctors(true);
      const response = await patientAPI.getDoctorsByHospital(hospitalId, hospitalName);
      setDoctors(response.data?.doctors || []);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      alert('❌ Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Handle hospital selection
  const selectHospital = (hospital: any) => {
    setSelectedHospital(hospital);
    setBookingForm(prev => ({ ...prev, hospitalId: hospital.hospitalId }));
    loadDoctors(hospital.hospitalId, hospital.hospitalName);
    setBookingStep(2);
  };

  // Handle doctor selection
  const selectDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setBookingForm(prev => ({ ...prev, doctorId: doctor.doctorId }));
    setBookingStep(3);
  };

  // Book appointment
  const bookAppointment = async () => {
    if (!bookingForm.hospitalId || !bookingForm.doctorId || !bookingForm.date || !bookingForm.time) {
      alert('❌ Please fill in all required fields');
      return;
    }

    try {
      // Get patientId from user profile
      let currentPatientId = user?.patientId || user?.roleSpecificId;

      if (!currentPatientId) {
        // Try to get from profile API
        try {
          const profileResponse = await patientAPI.getProfile();
          const profileData = profileResponse?.data || profileResponse;
          currentPatientId = profileData?.patientId || profileData?.roleSpecificId;

          if (profileData) {
            setUser(profileData);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      }

      if (!currentPatientId) {
        alert('❌ Patient ID not found. Please refresh and try again.');
        return;
      }

      const appointmentData = {
        patientId: currentPatientId,
        doctorId: bookingForm.doctorId,
        hospitalId: bookingForm.hospitalId, // Include hospitalId when booking
        appointmentDate: bookingForm.date,
        appointmentTime: bookingForm.time,
        type: bookingForm.type || 'consultation',
        symptoms: bookingForm.symptoms ? [bookingForm.symptoms] : []
      };

      const response = await patientAPI.bookAppointment(appointmentData);
      const appointmentResponse = response.data || response;

      // Transform backend response to frontend format
      const transformedAppointment = {
        _id: appointmentResponse.appointmentId || appointmentResponse._id,
        appointmentId: appointmentResponse.appointmentId,
        doctorName: selectedDoctor?.name || selectedDoctor?.userId?.name || 'Doctor',
        doctorId: appointmentResponse.doctorId,
        date: appointmentResponse.appointmentDate || bookingForm.date,
        time: appointmentResponse.appointmentTime || bookingForm.time,
        type: appointmentResponse.type || bookingForm.type,
        status: appointmentResponse.status || 'scheduled',
        qrCode: appointmentResponse.qrCode,
        meetingLink: appointmentResponse.meetingLink,
        symptoms: Array.isArray(appointmentResponse.symptoms)
          ? appointmentResponse.symptoms.join(', ')
          : (appointmentResponse.symptoms || bookingForm.symptoms)
      };

      setAppointments(prev => [transformedAppointment, ...prev]);
      setBookingForm({ hospitalId: '', doctorId: '', date: '', time: '', type: 'consultation', symptoms: '' });
      setShowBookingForm(false);
      setBookingStep(1);
      setSelectedHospital(null);
      setSelectedDoctor(null);

      // Show the QR code immediately after booking
      setShowNewAppointmentQR(transformedAppointment);

      alert('✅ Appointment booked successfully!');

      // Reload appointments to get fresh data from backend
      loadUserData();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      alert('❌ Failed to book appointment: ' + (error.message || 'Unknown error'));
    }
  };

  // Start booking flow
  const startBooking = () => {
    setActiveTab('appointments');
    setShowBookingForm(true);
    setBookingStep(1);
    getUserLocation();
  };

  const joinVideoCall = (appointment: Appointment) => {
    if (appointment.meetingLink) {
      window.open(appointment.meetingLink, '_blank');
    } else {
      alert('❌ Video call link not available for this appointment');
    }
  };

  const showQRCode = async (appointment: Appointment) => {
    // Ensure doctorName is populated before showing QR code
    if (!appointment.doctorName || appointment.doctorName === 'Doctor') {
      if (appointment.doctorId) {
        try {
          const doctorResponse = await patientAPI.getDoctorDetails(appointment.doctorId);
          const doctorData = doctorResponse?.data || doctorResponse;
          const doctorName = doctorData?.name || doctorData?.userId?.name || 'Doctor';
          setShowQRModal({ ...appointment, doctorName });
        } catch (err) {
          console.warn('Could not fetch doctor details for QR code:', err);
          setShowQRModal(appointment);
        }
      } else {
        setShowQRModal(appointment);
      }
    } else {
      setShowQRModal(appointment);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await patientAPI.cancelAppointment(appointmentId);
      alert('✅ Appointment cancelled successfully');
      // Reload appointments
      await loadUserData();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      alert(error.message || '❌ Failed to cancel appointment. Please try again.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.unread);

      await Promise.all(
        unreadNotifications.map(notification =>
          patientAPI.markNotificationRead(notification._id)
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      alert('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      alert('❌ Failed to mark notifications as read');
    }
  };



  const saveSettings = async () => {
    try {
      const updatedUser = await patientAPI.updateProfile(userSettings);
      setUser(updatedUser);

      // Update localStorage
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      alert('✅ Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert('❌ Failed to save settings: ' + (error.message || 'Unknown error'));
    }
  };

  const downloadQRCode = (appointment: Appointment) => {
    // Create a canvas to convert the QR code to image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 300;

    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'black';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HEALTHCARE QR CODE', canvas.width / 2, 20);
      ctx.fillText(`Appointment: ${appointment._id}`, canvas.width / 2, 40);
      ctx.fillText(`Patient: ${user?.name || 'Patient'}`, canvas.width / 2, 60);
      ctx.fillText(`Doctor: ${appointment.doctorName}`, canvas.width / 2, 80);
      ctx.fillText(`Date: ${appointment.date}`, canvas.width / 2, 100);
      ctx.fillText(`Time: ${appointment.time}`, canvas.width / 2, 120);

      const patternSize = 8;
      const startX = 50;
      const startY = 140;
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(startX + i * patternSize, startY + j * patternSize, patternSize, patternSize);
          }
        }
      }
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appointment_qr_${appointment._id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('✅ QR Code downloaded successfully!');
      }
    });
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      navigate('/');
    }
  };

  /* New Render Overview with Bento Grid Layout */
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Hero - Compact & Premium */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl p-8 shadow-lg text-white">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-primary-100/90 text-lg font-light leading-relaxed">
            You have <strong className="text-white font-semibold">{appointments.filter(a => a.status === 'scheduled').length} upcoming appointments</strong> and your latest health report is ready.
          </p>
          <div className="mt-6 flex space-x-3">
            <button onClick={() => startBooking()} className="bg-white text-primary-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors shadow-sm">
              Book Appointment
            </button>
            <button onClick={() => setActiveTab('medical-history')} className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary-800/50 hover:bg-primary-800 transition-colors border border-primary-600/30">
              View History
            </button>
          </div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Grid - Using Reusable Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Medical Scans"
          value={scans.length.toString()}
          icon="🩺"
          color="blue"
          onClick={() => setActiveTab('medical-history')}
        />
        <StatCard
          label="Upcoming Visits"
          value={appointments.filter(a => a.status === 'scheduled').length.toString()}
          icon="📅"
          color="purple"
          onClick={() => setActiveTab('appointments')}
        />
        <StatCard
          label="New Notifications"
          value={notifications.filter(n => n.unread).length.toString()}
          icon="🔔"
          color="yellow"
          onClick={() => setActiveTab('notifications')}
        />
        <StatCard
          label="Health Score"
          value="98%"
          icon="❤️"
          color="teal"
          trend="2%"
          trendUp={true}
        />
      </div>

      {/* Main Content Split: Recent Scans & Upcoming Appointments */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Col (2/3): Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Upcoming Appointments</h3>
            <button onClick={() => setActiveTab('appointments')} className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              View All
            </button>
          </div>

          {appointments.filter(apt => apt.status !== 'completed').length > 0 ? (
            <div className="space-y-4">
              {appointments
                .filter(apt => apt.status !== 'completed')
                .slice(0, 3)
                .map(apt => (
                  <AppointmentCard
                    key={apt._id}
                    doctorName={apt.doctorName}
                    specialty="General Medicine" // Placeholder
                    date={apt.date}
                    time={apt.time}
                    type={apt.type}
                    status={apt.status}
                    meetingLink={apt.meetingLink}
                    onJoinCheck={() => joinVideoCall(apt)}
                    onQrCode={() => showQRCode(apt)}
                  />
                ))}
            </div>
          ) : (
            <div className="bg-surface-50 rounded-2xl p-8 text-center border border-dashed border-gray-200 hover:border-medical-300 transition-colors">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm text-gray-400">📅</div>
              <p className="text-gray-600 font-medium">No upcoming appointments</p>
              <button onClick={() => startBooking()} className="mt-4 text-sm font-semibold text-medical-600 hover:text-medical-700">
                + Book Now
              </button>
            </div>
          )}
        </div>

        {/* Right Col (1/3): Recent Scans */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Recent Scans</h3>
            <button onClick={() => setActiveTab('medical-history')} className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              View All
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
            {scans.length > 0 ? (
              scans.slice(0, 4).map(scan => (
                <ScanCard
                  key={scan._id}
                  type={scan.scanType}
                  date={scan.uploadDate}
                  status={scan.status}
                  confidence={scan.aiResults?.confidence}
                  onClick={() => setActiveTab('medical-history')}
                />
              ))
            ) : (
              <div className="text-center py-8 bg-surface-50 rounded-xl mx-2">
                <div className="text-2xl mb-2 grayscale opacity-50">📂</div>
                <p className="text-gray-400 text-sm font-medium">No medical scans found</p>
              </div>
            )}

            <button className="w-full py-3 mt-2 border-t border-gray-100 text-sm font-semibold text-gray-500 hover:text-primary-600 transition-colors">
              + Upload New Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Refresh prescriptions when medical history tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      const refreshPrescriptions = async () => {
        try {
          const prescriptionsResponse = await patientAPI.getPrescriptions();
          const prescriptionsData = Array.isArray(prescriptionsResponse)
            ? prescriptionsResponse
            : (prescriptionsResponse?.data || prescriptionsResponse?.prescriptions || []);
          setPrescriptions(prescriptionsData);
          console.log('🔄 Refreshed prescriptions:', prescriptionsData.length);
        } catch (error) {
          console.error('Error refreshing prescriptions:', error);
        }
      };

      refreshPrescriptions();
    }
  }, [activeTab]);


  const renderMedicalHistory = () => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Complete Medical History</h3>
            <button
              onClick={downloadReport}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span>📥</span>
              <span>Download All Reports</span>
            </button>
          </div>

          {completedAppointments.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {completedAppointments.map(appointment => {


                return (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setViewingAppointment(appointment)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-3">
                          Appointment with {appointment.doctorName}
                        </h4>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <span className="text-sm">📅</span>
                          <span className="text-sm">
                            {new Date(appointment.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}, {appointment.time}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Doctor:</strong> {appointment.doctorName}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Type:</strong> {appointment.type || 'consultation'}
                        </p>
                        {appointment.symptoms && (
                          <p className="text-sm text-gray-600">
                            <strong>Symptoms:</strong> {appointment.symptoms}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadIndividualAppointmentReport(appointment);
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-semibold flex items-center gap-2"
                      >
                        <span>📥</span>
                        <span>Download</span>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Generate Blob URL and Open
                          try {
                            const aptData = {
                              appointmentId: appointment.appointmentId || appointment._id,
                              doctorName: appointment.doctorName,
                              date: appointment.date,
                              time: appointment.time,
                              type: appointment.type || 'consultation',
                              symptoms: appointment.symptoms || ''
                            };

                            const appointmentPrescription = prescriptions.find(
                              p => p.appointmentId === appointment.appointmentId || p.appointmentId === appointment._id
                            );

                            const presData = appointmentPrescription ? {
                              diagnosis: appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis,
                              medicines: appointmentPrescription.digitalPrescription?.medicines,
                              notes: appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes,
                              imageUrl: appointmentPrescription.imagePrescription?.filePath
                            } : null;

                            const blobUrl = await generateMedicalReportPDFBlobUrl(
                              aptData,
                              presData,
                              user?.name || 'Patient'
                            );
                            window.open(blobUrl, '_blank');
                          } catch (err) {
                            console.error('Error opening PDF:', err);
                            alert('Could not generate PDF preview');
                          }
                        }}
                        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-semibold flex items-center gap-2"
                      >
                        <span>👁️</span>
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🩺</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Medical History Yet</h3>
              <p className="text-gray-600">Your completed appointments will appear here once available.</p>
            </div>
          )}
        </div>

        {/* Appointment Details Modal */}
        {viewingAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Appointment Details</h3>
                  <button
                    onClick={() => setViewingAppointment(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Appointment with {viewingAppointment.doctorName}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600"><strong>Date:</strong> {new Date(viewingAppointment.date).toLocaleDateString()}</p>
                        <p className="text-gray-600"><strong>Time:</strong> {viewingAppointment.time}</p>
                      </div>
                      <div>
                        <p className="text-gray-600"><strong>Type:</strong> {viewingAppointment.type || 'consultation'}</p>
                        <p className="text-gray-600"><strong>Status:</strong> {viewingAppointment.status}</p>
                      </div>
                    </div>
                    {viewingAppointment.symptoms && (
                      <p className="text-gray-600 mt-2">
                        <strong>Symptoms:</strong> {viewingAppointment.symptoms}
                      </p>
                    )}
                  </div>

                  {(() => {
                    // Try multiple matching strategies
                    const appointmentPrescription = prescriptions.find(
                      p => {
                        const match1 = p.appointmentId === viewingAppointment.appointmentId;
                        const match2 = p.appointmentId === viewingAppointment._id;
                        const match3 = p.appointmentId === String(viewingAppointment.appointmentId);
                        const match4 = p.appointmentId === String(viewingAppointment._id);
                        return match1 || match2 || match3 || match4;
                      }
                    );

                    // Debug logging
                    if (!appointmentPrescription) {
                      console.log('🔍 Prescription search:', {
                        appointmentId: viewingAppointment.appointmentId,
                        appointment_id: viewingAppointment._id,
                        totalPrescriptions: prescriptions.length,
                        prescriptionAppointmentIds: prescriptions.map(p => p.appointmentId)
                      });
                    } else {
                      console.log('✅ Found prescription:', {
                        prescriptionId: appointmentPrescription.prescriptionId,
                        hasDigital: !!appointmentPrescription.digitalPrescription,
                        hasImage: !!appointmentPrescription.imagePrescription,
                        medicines: appointmentPrescription.digitalPrescription?.medicines?.length || 0
                      });
                    }

                    if (appointmentPrescription) {
                      const hasDigitalPrescription = appointmentPrescription.digitalPrescription?.medicines && appointmentPrescription.digitalPrescription.medicines.length > 0;
                      const hasImagePrescription = appointmentPrescription.imagePrescription?.filePath;
                      const hasDiagnosis = appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis;
                      const hasNotes = appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes;

                      // Show prescription if there's any content
                      if (hasDigitalPrescription || hasImagePrescription || hasDiagnosis || hasNotes) {
                        return (
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h5 className="font-semibold text-green-800 mb-3">📋 Prescription Details</h5>

                            {hasDiagnosis && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</p>
                                <p className="text-sm text-gray-600">
                                  {appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis}
                                </p>
                              </div>
                            )}

                            {hasDigitalPrescription && appointmentPrescription.digitalPrescription?.medicines && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">💊 Medications:</p>
                                <ul className="space-y-2">
                                  {appointmentPrescription.digitalPrescription.medicines.map((med: any, idx: number) => (
                                    <li key={idx} className="text-sm text-gray-600 bg-white p-2 rounded">
                                      <strong>{med.name}</strong> - {med.dosage} ({med.frequency}) for {med.duration}
                                      {med.instructions && (
                                        <p className="text-xs text-gray-500 mt-1">Instructions: {med.instructions}</p>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {hasImagePrescription && appointmentPrescription.imagePrescription && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">📷 Prescription Image:</p>
                                <div className="bg-white p-2 rounded">
                                  <img
                                    src={`http://localhost:5001${appointmentPrescription.imagePrescription.filePath}`}
                                    alt="Prescription"
                                    className="max-w-full h-auto rounded border border-gray-200"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">{appointmentPrescription.imagePrescription.fileName}</p>
                                </div>
                              </div>
                            )}

                            {hasNotes && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Doctor Notes:</p>
                                <p className="text-sm text-gray-600">
                                  {appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes}
                                </p>
                              </div>
                            )}

                            {appointmentPrescription.digitalPrescription?.followUpDate && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Follow-up Date:</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(appointmentPrescription.digitalPrescription.followUpDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600">Prescription data is incomplete or unavailable.</p>
                          </div>
                        );
                      }
                    } else {
                      return (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600">No prescription available for this appointment.</p>
                        </div>
                      );
                    }
                  })()}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setViewingAppointment(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      downloadIndividualAppointmentReport(viewingAppointment);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <span>📥</span>
                    <span>Download Report</span>
                  </button>
                  <button
                    onClick={async () => {
                      // Generate Blob URL and Open
                      try {
                        const aptData = {
                          appointmentId: viewingAppointment.appointmentId || viewingAppointment._id,
                          doctorName: viewingAppointment.doctorName,
                          date: viewingAppointment.date,
                          time: viewingAppointment.time,
                          type: viewingAppointment.type || 'consultation',
                          symptoms: viewingAppointment.symptoms || ''
                        };

                        const appointmentPrescription = prescriptions.find(
                          p => {
                            const match1 = p.appointmentId === viewingAppointment.appointmentId;
                            const match2 = p.appointmentId === viewingAppointment._id;
                            const match3 = p.appointmentId === String(viewingAppointment.appointmentId);
                            const match4 = p.appointmentId === String(viewingAppointment._id);
                            return match1 || match2 || match3 || match4;
                          }
                        );

                        const presData = appointmentPrescription ? {
                          diagnosis: appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis,
                          medicines: appointmentPrescription.digitalPrescription?.medicines,
                          notes: appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes,
                          imageUrl: appointmentPrescription.imagePrescription?.filePath
                        } : null;

                        const blobUrl = await generateMedicalReportPDFBlobUrl(
                          aptData,
                          presData,
                          user?.name || 'Patient'
                        );
                        window.open(blobUrl, '_blank');
                      } catch (err) {
                        console.error('Error opening PDF:', err);
                        alert('Could not generate PDF preview');
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <span>👁️</span>
                    <span>View Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAppointments = () => (
    <div className="space-y-6">
      {/* Book New Appointment */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Book New Appointment</h3>
          <button
            onClick={() => {
              if (showBookingForm) {
                setShowBookingForm(false);
                setBookingStep(1);
                setSelectedHospital(null);
                setSelectedDoctor(null);
              } else {
                startBooking();
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            {showBookingForm ? 'Cancel' : '📅 New Appointment'}
          </button>
        </div>

        {showBookingForm && (
          <div className="border rounded-lg p-6 bg-blue-50">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className={`flex items-center ${bookingStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  {bookingStep > 1 ? '✓' : '1'}
                </div>
                <span className="ml-2 font-medium">Select Hospital</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-gray-300"></div>
              <div className={`flex items-center ${bookingStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  {bookingStep > 2 ? '✓' : '2'}
                </div>
                <span className="ml-2 font-medium">Select Doctor</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-gray-300"></div>
              <div className={`flex items-center ${bookingStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">Book Slot</span>
              </div>
            </div>

            {/* Step 1: Select Hospital */}
            {bookingStep === 1 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">🏥 Select Hospital/Clinic</h4>
                  {userLocation && (
                    <div className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
                      📍 Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </div>
                  )}
                </div>

                {/* Auto-load hospitals based on location - NO CITY SEARCH NEEDED */}
                {userLocation ? (
                  <div className="mb-4 space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-800">
                        📍 Showing hospitals & clinics within <strong>{radiusKm}km</strong> of your location
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </p>
                    </div>
                    {/* Radius Filter - EXACT hos style */}
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                        🔍 Filter by Radius:
                      </label>
                      <select
                        value={radiusKm}
                        onChange={(e) => {
                          const newRadius = Number(e.target.value);
                          setRadiusKm(newRadius);
                          // Reload hospitals with new radius
                          if (userLocation) {
                            loadHospitals(userLocation.latitude, userLocation.longitude);
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                      >
                        <option value={1}>1 km</option>
                        <option value={2}>2 km</option>
                        <option value={3}>3 km</option>
                        <option value={5}>5 km</option>
                      </select>
                      <span className="text-xs text-gray-500">
                        Results will update automatically
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-3">
                      📍 <strong>Fetching your location...</strong> Hospitals will load automatically.
                    </p>
                    {!loadingHospitals && (
                      <button
                        onClick={getUserLocation}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
                      >
                        📍 Allow Location Access
                      </button>
                    )}
                  </div>
                )}

                {loadingHospitals ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading nearby hospitals...</p>
                    {!userLocation && (
                      <p className="text-sm text-gray-500 mt-2">Fetching your location...</p>
                    )}
                  </div>
                ) : hospitals.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-md font-semibold text-gray-700">
                        📋 Found {hospitals.length} {hospitals.length === 1 ? 'Medical Facility' : 'Medical Facilities'} (Hospitals & Clinics)
                      </h5>
                      {userLocation && (
                        <span className="text-xs text-green-600 font-semibold">📍 Sorted by distance (closest first)</span>
                      )}
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {hospitals.map((hospital, index) => (
                        <div
                          key={hospital.hospitalId}
                          onClick={() => selectHospital(hospital)}
                          className={`border-2 rounded-lg p-5 cursor-pointer transition-all shadow-sm ${selectedHospital?.hospitalId === hospital.hospitalId
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                            }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {userLocation && hospital.distance && (
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                    #{index + 1}
                                  </span>
                                )}
                                {hospital.type && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${hospital.type === 'Clinic'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {hospital.type === 'Clinic' ? '🏥 Clinic' : '🏨 Hospital'}
                                  </span>
                                )}
                                <h5 className="font-bold text-lg text-gray-900">{hospital.hospitalName}</h5>
                                {(hospital.distanceM !== undefined || hospital.distance !== undefined) && (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                    📍 {(() => {
                                      const meters = hospital.distanceM !== undefined
                                        ? hospital.distanceM
                                        : (hospital.distance ? hospital.distance * 1000 : 0);
                                      const km = meters / 1000;
                                      if (meters < 1000) {
                                        return `${Math.round(meters)} m (${km.toFixed(3)} km)`;
                                      }
                                      return `${km.toFixed(2)} km (${Math.round(meters)} m)`;
                                    })()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                📍 {hospital.address?.fullAddress || `${hospital.address?.street || ''}, ${hospital.address?.city || ''}, ${hospital.address?.state || ''}`}
                              </p>
                              {hospital.departments && hospital.departments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {hospital.departments.slice(0, 5).map((dept: string, idx: number) => (
                                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                      🏥 {dept}
                                    </span>
                                  ))}
                                  {hospital.departments.length > 5 && (
                                    <span className="text-xs text-gray-500">+{hospital.departments.length - 5} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap shadow-sm">
                              Select →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No hospitals found. Try searching by city.</p>
                    <div className="flex gap-2 justify-center max-w-md mx-auto">
                      <input
                        type="text"
                        placeholder="Enter city name (e.g., Mumbai, Delhi)..."
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (searchCity.trim()) {
                              loadHospitals(undefined, undefined, searchCity.trim());
                            } else {
                              loadHospitals();
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (searchCity.trim()) {
                            loadHospitals(undefined, undefined, searchCity.trim());
                          } else {
                            loadHospitals();
                          }
                        }}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-medium"
                      >
                        🔍 Search
                      </button>
                    </div>
                    {searchCity && (
                      <p className="text-sm text-gray-500 mt-2">Press Enter or click Search</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Doctor */}
            {bookingStep === 2 && selectedHospital && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setBookingStep(1);
                      setSelectedDoctor(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 mb-2"
                  >
                    ← Back to Hospitals
                  </button>
                  <h4 className="text-lg font-semibold text-gray-900">
                    👨‍⚕️ Select Doctor at {selectedHospital.hospitalName}
                  </h4>
                </div>
                {loadingDoctors ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading doctors...</p>
                  </div>
                ) : doctors.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.doctorId}
                        onClick={() => selectDoctor(doctor)}
                        className="border border-gray-300 rounded-lg p-4 hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold text-gray-900">{doctor.name}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              🎓 {doctor.specialization?.join(', ') || 'General Practice'}
                            </p>
                            <p className="text-sm text-gray-600">
                              💼 {doctor.experience} years experience
                            </p>
                            <p className="text-sm text-gray-600">
                              💰 ₹{doctor.consultationFee || 500} consultation fee
                            </p>
                          </div>
                          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                            Select →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No doctors available at this hospital.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Book Appointment Slot */}
            {bookingStep === 3 && selectedDoctor && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setBookingStep(2);
                    }}
                    className="text-blue-600 hover:text-blue-800 mb-2"
                  >
                    ← Back to Doctors
                  </button>
                  <h4 className="text-lg font-semibold text-gray-900">
                    📅 Book Appointment with {selectedDoctor.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedHospital.hospitalName} • {selectedDoctor.specialization?.join(', ')}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
                    <select
                      value={bookingForm.type}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="consultation">In-Person Consultation</option>
                      <option value="video-call">Video Call</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date *</label>
                    <input
                      type="date"
                      value={bookingForm.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time *</label>
                    <input
                      type="time"
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms (Optional)</label>
                  <textarea
                    value={bookingForm.symptoms}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Describe your symptoms or reason for visit..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <button
                  onClick={bookAppointment}
                  className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold"
                >
                  📅 Confirm & Book Appointment
                </button>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Appointments List with Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">My Appointments</h3>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setAppointmentFilter('all')}
            className={`px-4 py-2 font-semibold transition-colors ${appointmentFilter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setAppointmentFilter('upcoming')}
            className={`px-4 py-2 font-semibold transition-colors ${appointmentFilter === 'upcoming'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Upcoming ({appointments.filter(apt => apt.status !== 'completed').length})
          </button>
          <button
            onClick={() => setAppointmentFilter('completed')}
            className={`px-4 py-2 font-semibold transition-colors ${appointmentFilter === 'completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Completed ({appointments.filter(apt => apt.status === 'completed').length})
          </button>
        </div>

        {/* Filtered Appointments */}
        {(() => {
          const filteredAppointments = appointments.filter(apt => {
            if (appointmentFilter === 'upcoming') return apt.status !== 'completed';
            if (appointmentFilter === 'completed') return apt.status === 'completed';
            return true;
          });

          if (filteredAppointments.length === 0) {
            return (
              <div className="text-center py-16 bg-surface-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-soft">
                  {appointmentFilter === 'completed' ? '✅' : appointmentFilter === 'upcoming' ? '🗓️' : '📋'}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {appointmentFilter === 'completed'
                    ? 'No Past Visits'
                    : appointmentFilter === 'upcoming'
                      ? 'No Upcoming Visits'
                      : 'No Appointments Found'}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-6">
                  {appointmentFilter === 'completed'
                    ? 'Your medical history for completed visits will appear here.'
                    : appointmentFilter === 'upcoming'
                      ? 'Schedule a consultation with one of our specialists.'
                      : 'Get started by booking your first appointment.'}
                </p>
                {appointmentFilter !== 'completed' && (
                  <button onClick={() => startBooking()} className="bg-medical-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-medical-700 shadow-lg shadow-medical-500/20 transition-all">
                    Book Appointment
                  </button>
                )}
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {filteredAppointments.map(appointment => {
                const appointmentPrescription = prescriptions.find(
                  p => p.appointmentId === appointment.appointmentId || p.appointmentId === appointment._id
                );

                const downloadReport = () => {
                  // Create report content
                  let reportContent = `MEDICAL CONSULTATION REPORT\n`;
                  reportContent += `================================\n\n`;
                  reportContent += `Appointment Details:\n`;
                  reportContent += `- Appointment ID: ${appointment.appointmentId || appointment._id}\n`;
                  reportContent += `- Doctor: ${appointment.doctorName || 'N/A'}\n`;
                  reportContent += `- Date: ${new Date(appointment.date).toLocaleDateString()}\n`;
                  reportContent += `- Time: ${appointment.time}\n`;
                  reportContent += `- Type: ${appointment.type || 'consultation'}\n`;
                  if (appointment.symptoms) {
                    reportContent += `- Symptoms: ${appointment.symptoms}\n`;
                  }
                  reportContent += `\n`;

                  if (appointmentPrescription) {
                    reportContent += `PRESCRIPTION DETAILS:\n`;
                    reportContent += `================================\n\n`;

                    if (appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis) {
                      reportContent += `Diagnosis: ${appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis}\n\n`;
                    }

                    if (appointmentPrescription.digitalPrescription?.medicines && appointmentPrescription.digitalPrescription.medicines.length > 0) {
                      reportContent += `Medications:\n`;
                      appointmentPrescription.digitalPrescription.medicines.forEach((med: any, idx: number) => {
                        reportContent += `${idx + 1}. ${med.name} - ${med.dosage} (${med.frequency}) for ${med.duration}\n`;
                        if (med.instructions) {
                          reportContent += `   Instructions: ${med.instructions}\n`;
                        }
                      });
                      reportContent += `\n`;
                    }

                    if (appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes) {
                      reportContent += `Doctor Notes:\n`;
                      reportContent += `${appointmentPrescription.notes || appointmentPrescription.digitalPrescription?.notes}\n\n`;
                    }

                    if (appointmentPrescription.digitalPrescription?.followUpDate) {
                      reportContent += `Follow-up Date: ${new Date(appointmentPrescription.digitalPrescription.followUpDate).toLocaleDateString()}\n\n`;
                    }
                  } else {
                    reportContent += `PRESCRIPTION:\n`;
                    reportContent += `No prescription available for this appointment.\n\n`;
                  }

                  reportContent += `Report Generated: ${new Date().toLocaleString()}\n`;

                  // Create and download file
                  const blob = new Blob([reportContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Medical_Report_${appointment.appointmentId || appointment._id}_${new Date().toISOString().split('T')[0]}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                };

                return (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {appointment.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          📅 {new Date(appointment.date).toLocaleDateString()} at ⏰ {appointment.time}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          🏥 {appointment.type || 'consultation'}
                        </p>
                        {appointment.symptoms && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Symptoms:</strong> {appointment.symptoms}
                          </p>
                        )}
                        {appointmentPrescription && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-800 mb-1">✅ Prescription Available</p>
                            {appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis ? (
                              <p className="text-xs text-green-700">
                                Diagnosis: {appointmentPrescription.diagnosis || appointmentPrescription.digitalPrescription?.diagnosis}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        {appointment.status === 'completed' && (
                          <button
                            onClick={downloadReport}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold text-sm whitespace-nowrap"
                          >
                            📥 Download Report
                          </button>
                        )}
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.meetingLink && (
                          <button
                            onClick={() => joinVideoCall(appointment)}
                            className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm font-semibold"
                          >
                            📹 Join Call
                          </button>
                        )}
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.qrCode && (
                          <button
                            onClick={() => showQRCode(appointment)}
                            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm font-semibold"
                          >
                            📱 QR Code
                          </button>
                        )}
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                handleCancelAppointment(appointment.appointmentId || appointment._id);
                              }
                            }}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm font-semibold"
                          >
                            ❌ Cancel Appointment
                          </button>
                        )}
                        {appointmentPrescription?.imagePrescription && (
                          <a
                            href={`http://localhost:5001/api/v1/prescriptions/${appointmentPrescription.prescriptionId}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 font-semibold text-sm text-center"
                          >
                            📄 Prescription PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Prescriptions Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">My Prescriptions</h3>
        {prescriptions.length > 0 ? (
          <div className="space-y-4">
            {prescriptions.map(prescription => (
              <div key={prescription._id || prescription.prescriptionId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Prescription #{prescription.prescriptionId || prescription._id}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {prescription.diagnosis && (
                      <p className="text-gray-700 mb-2">
                        <strong>Diagnosis:</strong> {prescription.diagnosis}
                      </p>
                    )}

                    {prescription.digitalPrescription?.medicines && prescription.digitalPrescription.medicines.length > 0 && (
                      <div className="mb-3">
                        <strong className="text-gray-700 block mb-2">Medications:</strong>
                        <ul className="list-disc list-inside space-y-1">
                          {prescription.digitalPrescription.medicines.map((med: any, idx: number) => (
                            <li key={idx} className="text-gray-600">
                              {med.name} - {med.dosage} ({med.frequency}) for {med.duration}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {prescription.notes && (
                      <p className="text-gray-600 mb-2">
                        <strong>Notes:</strong> {prescription.notes}
                      </p>
                    )}

                    {prescription.digitalPrescription?.notes && (
                      <p className="text-gray-600 mb-2">
                        <strong>Doctor Notes:</strong> {prescription.digitalPrescription.notes}
                      </p>
                    )}
                  </div>

                  <div className="ml-4">
                    {prescription.imagePrescription && (
                      <a
                        href={`http://localhost:5001/api/v1/prescriptions/${prescription.prescriptionId}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold inline-block"
                      >
                        📥 Download Prescription
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💊</div>
            <p className="text-gray-600">No prescriptions yet. Prescriptions will appear here after your consultation.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Health Notifications</h3>
          {notifications.some(n => n.unread) && (
            <button
              onClick={markAllAsRead}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div key={notification._id} className={`p-4 rounded-lg border ${notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">
                      {notification.type === 'scan_result' ? '🩺' :
                        notification.type === 'appointment' ? '📅' :
                          notification.type === 'medication' ? '💊' : '🔔'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {notification.unread && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-soft">🔔</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">All Caught Up!</h3>
            <p className="text-gray-500">You have no new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );


  const renderSettings = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">👤 Personal Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={userSettings.name}
              onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={userSettings.email}
              onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={userSettings.phone}
              onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={userSettings.dateOfBirth}
              onChange={(e) => setUserSettings(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={userSettings.address}
              onChange={(e) => setUserSettings(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
            <input
              type="tel"
              value={userSettings.emergencyContact}
              onChange={(e) => setUserSettings(prev => ({ ...prev, emergencyContact: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
            <select
              value={userSettings.bloodType}
              onChange={(e) => setUserSettings(prev => ({ ...prev, bloodType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">🩺 Medical Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
            <textarea
              value={userSettings.allergies.join(', ')}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                allergies: e.target.value.split(',').map(item => item.trim()).filter(item => item)
              }))}
              placeholder="Enter allergies separated by commas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
            <textarea
              value={userSettings.medications.join(', ')}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                medications: e.target.value.split(',').map(item => item.trim()).filter(item => item)
              }))}
              placeholder="Enter medications separated by commas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">🔔 Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Email Notifications</label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.notifications.email}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, email: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">SMS Notifications</label>
              <p className="text-sm text-gray-500">Receive notifications via SMS</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.notifications.sms}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, sms: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Push Notifications</label>
              <p className="text-sm text-gray-500">Receive browser push notifications</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.notifications.push}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, push: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Appointment Reminders</label>
              <p className="text-sm text-gray-500">Get reminders for upcoming appointments</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.notifications.appointmentReminders}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, appointmentReminders: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Scan Results</label>
              <p className="text-sm text-gray-500">Get notified when scan results are ready</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.notifications.scanResults}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, scanResults: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Medication Reminders</label>
              <p className="text-sm text-gray-500">Get reminders to take medications</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.notifications.medicationReminders}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, medicationReminders: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">🔒 Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Share Data with Doctors</label>
              <p className="text-sm text-gray-500">Allow doctors to access your medical history</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.privacy.shareDataWithDoctors}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, shareDataWithDoctors: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Share Data for Research</label>
              <p className="text-sm text-gray-500">Allow anonymous data usage for medical research</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.privacy.shareDataForResearch}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, shareDataForResearch: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Marketing Emails</label>
              <p className="text-sm text-gray-500">Receive promotional and marketing emails</p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.privacy.allowMarketingEmails}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, allowMarketingEmails: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Save Changes</h3>
            <p className="text-gray-600">Make sure to save your changes before leaving this page</p>
          </div>
          <button
            onClick={saveSettings}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold"
          >
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  // QR Code Modal (includes newly booked appointments)
  const QRCodeModal = () => {
    const appointmentToShow = showQRModal || showNewAppointmentQR;
    if (!appointmentToShow || !appointmentToShow.qrCode) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              📱 {showNewAppointmentQR ? 'New Appointment QR Code' : 'Appointment QR Code'}
            </h3>

            {showNewAppointmentQR && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 font-semibold">✅ Appointment Booked Successfully!</p>
                <p className="text-green-700 text-sm">Your QR code is ready for hospital check-in</p>
              </div>
            )}

            {/* Real QR Code */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4 mx-auto w-64 h-64 flex items-center justify-center">
              <QRCode
                value={appointmentToShow.qrCode}
                size={200}
                bgColor="white"
                fgColor="black"
                level="M"
              />
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600"><strong>Doctor:</strong> {appointmentToShow.doctorName || 'Doctor'}</p>
              <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(appointmentToShow.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600"><strong>Time:</strong> {appointmentToShow.time}</p>
              <p className="text-sm text-gray-600"><strong>Type:</strong> {appointmentToShow.type || 'consultation'}</p>
              <p className="text-sm text-gray-600"><strong>Patient ID:</strong> {user?.roleSpecificId}</p>
              <p className="text-xs text-gray-500 mt-2">
                <strong>Valid until:</strong> {appointmentToShow.date} (Appointment day only)
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Show this QR code at the hospital reception for quick check-in
            </p>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowQRModal(null);
                  setShowNewAppointmentQR(null);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => downloadQRCode(appointmentToShow)}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
              >
                📥 Save QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <DashboardLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        notifications={notifications}
        logout={handleLogout}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'medical-history' && renderMedicalHistory()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'settings' && renderSettings()}
      </DashboardLayout>

      {/* Global Modals */}
      <QRCodeModal />

      {showNewAppointmentQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-500 mb-6">Here is your appointment QR code.</p>

            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mb-6">
              <QRCode
                value={JSON.stringify({
                  appointmentId: showNewAppointmentQR._id,
                  patientId: user?._id || user?.patientId || user?.roleSpecificId
                })}
                size={180}
                level="H"
              />
            </div>

            <button onClick={() => setShowNewAppointmentQR(null)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientDashboard;

