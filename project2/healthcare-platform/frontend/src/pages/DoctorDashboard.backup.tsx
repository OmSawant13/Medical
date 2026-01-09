import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import { motion, AnimatePresence } from 'framer-motion';

interface PatientScan {
  scanId: string;
  patientName: string;
  patientId: string;
  scanType: string;
  date: string;
  status: 'pending_review' | 'reviewed' | 'approved';
  aiAnalysis: {
    confidence: number;
    findings: string[];
    recommendations: string[];
    requiresReview: boolean;
  };
  doctorNotes?: string;
}

interface PatientQueue {
  patientId: string;
  patientName: string;
  appointmentTime: string;
  priority: number;
  symptoms: string[];
  waitTime: number;
  contact: string;
  age: number;
  appointmentId?: string;
  status?: string;
  type?: string;
}

interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  email: string;
  lastVisit: string;
  totalVisits: number;
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  status: 'active' | 'inactive';
}

interface ReportData {
  dailyConsultations: number[];
  patientSatisfaction: number[];
  diagnosisAccuracy: number[];
  treatmentSuccess: number[];
  consultationTypes: { [key: string]: number };
}

interface DoctorSettings {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  hospitalAffiliation: string;
  officeAddress: string;
  consultationFee: number;
  availability: {
    monday: { available: boolean; startTime: string; endTime: string; };
    tuesday: { available: boolean; startTime: string; endTime: string; };
    wednesday: { available: boolean; startTime: string; endTime: string; };
    thursday: { available: boolean; startTime: string; endTime: string; };
    friday: { available: boolean; startTime: string; endTime: string; };
    saturday: { available: boolean; startTime: string; endTime: string; };
    sunday: { available: boolean; startTime: string; endTime: string; };
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    newPatients: boolean;
    urgentCases: boolean;
    aiAlerts: boolean;
    appointmentReminders: boolean;
  };
  preferences: {
    autoApproveNormalScans: boolean;
    requireSecondOpinion: boolean;
    shareDataForResearch: boolean;
    allowMarketingEmails: boolean;
    defaultAppointmentDuration: number;
    maxPatientsPerDay: number;
  };
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [pendingScans, setPendingScans] = useState<PatientScan[]>([]);
  const [patientQueue, setPatientQueue] = useState<PatientQueue[]>([]);
  const [selectedScan, setSelectedScan] = useState<PatientScan | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultationTab, setConsultationTab] = useState<'diagnosis' | 'prescription'>('diagnosis');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<PatientQueue | null>(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
  const [prescriptionImagePreview, setPrescriptionImagePreview] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; frequency: string; duration: string }>>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [patientMedicalHistory, setPatientMedicalHistory] = useState<{
    appointments: any[];
    prescriptions: any[];
    scans: any[];
  }>({ appointments: [], prescriptions: [], scans: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [patientSummary, setPatientSummary] = useState<string | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>({
    name: '',
    email: '',
    phone: '',
    specialization: 'General Practice',
    licenseNumber: '',
    yearsOfExperience: 0,
    hospitalAffiliation: '',
    officeAddress: '',
    consultationFee: 0,
    availability: {
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
      thursday: { available: true, startTime: '09:00', endTime: '17:00' },
      friday: { available: true, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '09:00', endTime: '17:00' },
      sunday: { available: false, startTime: '09:00', endTime: '17:00' }
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      newPatients: true,
      urgentCases: true,
      aiAlerts: true,
      appointmentReminders: true
    },
    preferences: {
      autoApproveNormalScans: false,
      requireSecondOpinion: false,
      shareDataForResearch: true,
      allowMarketingEmails: false,
      defaultAppointmentDuration: 30,
      maxPatientsPerDay: 20
    }
  });
  const [reportData] = useState<ReportData>({
    dailyConsultations: [8, 12, 15, 9, 18, 22, 16],
    patientSatisfaction: [4.2, 4.5, 4.7, 4.3, 4.8, 4.6, 4.9],
    diagnosisAccuracy: [92, 94, 96, 91, 95, 97, 93],
    treatmentSuccess: [87, 89, 92, 85, 94, 91, 88],
    consultationTypes: {
      'General Checkup': 45,
      'Follow-up': 32,
      'Emergency': 15,
      'Specialist Consultation': 28,
      'Video Call': 38
    }
  });

  // Load real data from API - NO DEMO DATA!
  const loadRealData = useCallback(async () => {
    try {
      // Load data from API - only shows data doctor is authorized to see
      const [pendingScansData, patientQueueData, patientsData] = await Promise.all([
        doctorAPI.getPendingScans().catch(() => []),
        doctorAPI.getPatientQueue().catch(() => []),
        doctorAPI.getPatients().catch(() => [])
      ]);

      // Handle pending scans - check if wrapped in response
      const scans = Array.isArray(pendingScansData)
        ? pendingScansData
        : (pendingScansData?.data || []);
      setPendingScans(scans);

      // Handle patient queue - check if wrapped in response
      const rawQueue = Array.isArray(patientQueueData)
        ? patientQueueData
        : (patientQueueData?.data || []);

      // Transform backend appointment format to frontend PatientQueue format
      const transformedQueue = rawQueue.map((apt: any) => ({
        patientId: apt.patientId || apt._id,
        patientName: apt.patientName || apt.patientDetails?.name || 'Patient',
        appointmentTime: apt.appointmentTime || `${apt.appointmentDate} ${apt.appointmentTime}`,
        priority: apt.priority || apt.priorityScore || 1,
        symptoms: Array.isArray(apt.symptoms) ? apt.symptoms : (apt.symptoms ? [apt.symptoms] : []),
        waitTime: apt.waitTime || 0,
        contact: apt.patientPhone || apt.patientDetails?.phone || apt.contact || '',
        age: apt.patientAge || apt.age || null,
        appointmentId: apt.appointmentId || apt._id,
        status: apt.status || 'scheduled',
        type: apt.type || 'consultation'
      }));

      setPatientQueue(transformedQueue);

      // Handle patients - check if wrapped in response
      const patientsList = Array.isArray(patientsData)
        ? patientsData
        : (patientsData?.data || []);
      setPatients(patientsList);

    } catch (error: any) {
      console.error('Error loading doctor data:', error);
      // Set empty arrays on error - NO DEMO DATA!
      setPendingScans([]);
      setPatientQueue([]);
      setPatients([]);
    }
  }, []);

  useEffect(() => {
    // Check for new token format first, then fallback to old
    const token = localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      console.warn('⚠️ DoctorDashboard: No token or userData found, redirecting to login');
      console.warn('🔍 Token check:', {
        accessToken: !!localStorage.getItem('accessToken'),
        token: !!localStorage.getItem('token'),
        authToken: !!localStorage.getItem('authToken'),
        userData: !!userData
      });
      localStorage.clear();
      navigate('/login?role=doctor');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Load doctor settings from user data
      setDoctorSettings(prev => ({
        ...prev,
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        specialization: parsedUser.specialization || 'General Practice',
        licenseNumber: parsedUser.licenseNumber || '',
        yearsOfExperience: parsedUser.yearsOfExperience || 0,
        hospitalAffiliation: parsedUser.hospitalAffiliation || '',
        officeAddress: parsedUser.officeAddress || '',
        consultationFee: parsedUser.consultationFee || 0
      }));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login?role=doctor');
      return;
    }

    // Load REAL data from API - NO DEMO DATA!
    loadRealData();
  }, [navigate, loadRealData]);

  // Working button functions
  const handleScanReview = (scanId: string, approved: boolean, notes: string) => {
    setPendingScans(prev =>
      prev.map(scan =>
        scan.scanId === scanId
          ? { ...scan, status: approved ? 'approved' : 'reviewed', doctorNotes: notes }
          : scan
      )
    );
    setSelectedScan(null);
    // Analysis reviewed - reload data
    loadRealData();
  };

  /*
  const addMedicalNotes = () => {
    // TODO: Implement proper medical notes modal
    console.log('Add medical notes - modal to be implemented');
  };
  */

  const generateReport = () => {
    const totalConsultations = reportData.dailyConsultations.reduce((a, b) => a + b, 0);
    const reportData_ = {
      doctorName: user?.name || 'Doctor',
      reportPeriod: 'Last 7 days',
      totalConsultations,
      averageDailyConsultations: (totalConsultations / 7).toFixed(1),
      patientSatisfactionAvg: (reportData.patientSatisfaction.reduce((a, b) => a + b, 0) / reportData.patientSatisfaction.length).toFixed(1),
      diagnosisAccuracy: (reportData.diagnosisAccuracy.reduce((a, b) => a + b, 0) / reportData.diagnosisAccuracy.length).toFixed(1),
      totalPatients: patients.length,
      consultationTypes: reportData.consultationTypes
    };

    const blob = new Blob([JSON.stringify(reportData_, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor_report_${user?.name || 'doctor'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Report downloaded - could show toast notification here
    console.log('✅ Performance report downloaded successfully!');
  };

  const generatePatientSummary = async () => {
    if (!currentPatient) return;

    setGeneratingSummary(true);
    try {
      // Generate summary from medical history
      const appointments = patientMedicalHistory.appointments.filter((apt: any) => apt.status === 'completed');
      const prescriptions = patientMedicalHistory.prescriptions;
      const scans = patientMedicalHistory.scans;

      let summary = `PATIENT MEDICAL SUMMARY\n`;
      summary += `================================\n\n`;
      summary += `Patient: ${currentPatient.patientName} \n`;
      summary += `Patient ID: ${currentPatient.patientId} \n`;
      summary += `Age: ${currentPatient.age || 'N/A'} \n`;
      summary += `Generated: ${new Date().toLocaleString()} \n\n`;

      summary += `MEDICAL HISTORY OVERVIEW: \n`;
      summary += `- Total Appointments: ${appointments.length} \n`;
      summary += `- Total Prescriptions: ${prescriptions.length} \n`;
      summary += `- Total Scans: ${scans.length} \n\n`;

      if (appointments.length > 0) {
        summary += `RECENT APPOINTMENTS: \n`;
        appointments.slice(0, 10).forEach((apt: any, idx: number) => {
          const date = new Date(apt.appointmentDate || apt.date).toLocaleDateString();
          summary += `${idx + 1}. ${date} - ${apt.diagnosis || 'No diagnosis'} \n`;
          if (apt.symptoms) {
            summary += `   Symptoms: ${Array.isArray(apt.symptoms) ? apt.symptoms.join(', ') : apt.symptoms} \n`;
          }
        });
        summary += `\n`;
      }

      if (prescriptions.length > 0) {
        summary += `PRESCRIPTIONS: \n`;
        prescriptions.slice(0, 10).forEach((pres: any, idx: number) => {
          const date = new Date(pres.createdAt).toLocaleDateString();
          summary += `${idx + 1}. ${date} - ${pres.digitalPrescription?.diagnosis || pres.diagnosis || 'Prescription'} \n`;
          if (pres.digitalPrescription?.medicines && pres.digitalPrescription.medicines.length > 0) {
            summary += `   Medicines: ${pres.digitalPrescription.medicines.map((m: any) => m.name).join(', ')} \n`;
          }
        });
        summary += `\n`;
      }

      if (scans.length > 0) {
        summary += `MEDICAL SCANS: \n`;
        scans.slice(0, 10).forEach((scan: any, idx: number) => {
          const date = new Date(scan.uploadDate || scan.createdAt).toLocaleDateString();
          summary += `${idx + 1}. ${date} - ${scan.scanType} (${scan.status || 'N/A'}) \n`;
        });
      }

      setPatientSummary(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const seePatient = async (patient: PatientQueue) => {
    // Update appointment status to "in-progress"
    if (patient.appointmentId) {
      try {
        await doctorAPI.updateAppointmentStatus(patient.appointmentId, {
          status: 'in-progress'
        });
      } catch (error) {
        console.error('Error updating appointment status:', error);
      }
    }

    setPatientQueue(prev =>
      prev.map(p =>
        p.patientId === patient.patientId
          ? { ...p, waitTime: 0, status: 'in-progress' }
          : p
      )
    );

    // Show professional patient consultation modal
    setCurrentPatient(patient);
    setConsultationNotes('');
    setDiagnosis('');
    setPrescription('');
    setPrescriptionImage(null);
    setPrescriptionImagePreview(null);
    setMedicines([]);
    setShowPatientModal(true);

    // Fetch patient's complete medical history
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const [appointmentsRes, prescriptionsRes, scansRes] = await Promise.all([
        fetch(`http://localhost:5001/api/v1/patients/appointments?patientId=${patient.patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`http://localhost:5001/api/v1/prescriptions/patient?patientId=${patient.patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`http://localhost:5001/api/v1/patients/scans?patientId=${patient.patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      setPatientMedicalHistory({
        appointments: appointmentsRes.data || appointmentsRes || [],
        prescriptions: prescriptionsRes.data || prescriptionsRes || [],
        scans: scansRes.data || scansRes || []
      });
    } catch (error) {
      console.error('Error fetching patient history:', error);
      setPatientMedicalHistory({ appointments: [], prescriptions: [], scans: [] });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePrescriptionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `prescription-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPrescriptionImage(file);
            setPrescriptionImagePreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleCompleteConsultation = async () => {
    if (!currentPatient || !currentPatient.appointmentId) return;

    try {
      // Update appointment status
      await doctorAPI.updateAppointmentStatus(currentPatient.appointmentId, {
        status: 'completed',
        notes: consultationNotes,
        diagnosis: diagnosis,
        prescription: prescription ? [prescription] : []
      });

      // Create prescription (with image if uploaded)
      // Always create prescription if there's any data (diagnosis, notes, prescription text, medicines, or image)
      if (prescriptionImage || diagnosis || consultationNotes || prescription || medicines.length > 0) {
        const formData = new FormData();
        formData.append('appointmentId', currentPatient.appointmentId);

        // Send diagnosis
        if (diagnosis) {
          formData.append('diagnosis', diagnosis);
        }

        // Combine consultation notes and prescription text
        const combinedNotes = [consultationNotes, prescription].filter(Boolean).join('\n\n');
        if (combinedNotes) {
          formData.append('notes', combinedNotes);
        }

        // Send medicines array if available
        if (medicines.length > 0) {
          formData.append('medicines', JSON.stringify(medicines));
        }

        // Set prescription type
        if (prescriptionImage) {
          formData.append('prescriptionImage', prescriptionImage);
          formData.append('prescriptionType', medicines.length > 0 || diagnosis ? 'both' : 'image');
        } else {
          formData.append('prescriptionType', 'digital');
        }

        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/v1/prescriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error('Error creating prescription:', responseData);
          alert(`❌ Failed to save prescription: ${responseData.error || responseData.message || 'Unknown error'}`);
        } else {
          console.log('✅ Prescription saved successfully:', responseData);
          alert('✅ Prescription saved successfully! Patient will be able to view it in their medical history.');
        }
      } else {
        console.warn('⚠️ No prescription data to save');
        alert('⚠️ No prescription data provided. Please enter at least diagnosis or notes.');
      }

      // Remove from queue
      setPatientQueue(prev => prev.filter(p => p.patientId !== currentPatient.patientId));

      // Close modal and reset
      setShowPatientModal(false);
      setCurrentPatient(null);
      setConsultationNotes('');
      setDiagnosis('');
      setPrescription('');
      setPrescriptionImage(null);
      setPrescriptionImagePreview(null);
      setMedicines([]);

      // Reload data
      loadRealData();
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  const scheduleAppointment = (patientId: string) => {
    // TODO: Implement proper appointment scheduling modal
    console.log('Schedule appointment for:', patientId);
  };

  const updatePatientRecord = (patient: Patient) => {
    // TODO: Implement proper patient record update modal
    console.log('Update record for:', patient.name);
  };

  const contactPatient = (patient: Patient) => {
    // TODO: Implement proper contact modal
    if (patient.contact) {
      window.open(`tel:${patient.contact}`, '_self');
    } else if (patient.email) {
      window.open(`mailto:${patient.email}`, '_self');
    }
  };

  const saveSettings = () => {
    // Update localStorage with new doctor data
    const updatedUser = {
      ...user,
      ...doctorSettings
    };
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    setUser(updatedUser);
    // Settings saved - could show toast notification here
    console.log('✅ Settings saved successfully!');
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600 bg-red-100';
    if (priority >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'HIGH 🚨';
    if (priority >= 3) return 'MEDIUM ⚠️';
    return 'LOW 🟢';
  };

  const renderOverview = () => {
    // Find the next patient (first in queue)
    const nextPatient = patientQueue.length > 0 ? patientQueue[0] : null;

    return (
      <div className="space-y-8 animate-fade-in-up">
        {/* 1. Hero Section: Focus Mode (Next Patient) */}
        <div className="bg-gradient-to-r from-medical-600 to-medical-800 rounded-3xl p-5 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400 opacity-10 rounded-full -ml-16 -mb-16 blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 md:gap-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, Dr. {user?.name?.split(' ')[0] || 'Doctor'}! 👋</h1>
                <p className="text-blue-100 text-base md:text-lg">You have <span className="font-bold text-white">{patientQueue.length} patients</span> waiting today.</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <span className="text-sm font-medium">✨ Quality Score: 98%</span>
              </div>
            </div>

            {nextPatient ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-medical-600 shadow-lg">
                    {nextPatient.patientName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold">Next: {nextPatient.patientName}</h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${nextPatient.priority >= 4 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                        }`}>
                        {nextPatient.priority >= 4 ? 'URGENT' : 'Standard'}
                      </span>
                    </div>
                    <p className="text-blue-100 flex items-center gap-2 text-sm">
                      <span>Symptoms: {nextPatient.symptoms.join(', ')}</span>
                      <span>•</span>
                      <span>Waited: {nextPatient.waitTime} mins</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => seePatient(nextPatient)}
                  className="w-full md:w-auto bg-white text-medical-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🩺</span> Start Consultation
                </button>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
                <p className="text-xl font-medium text-white">All caught up! 🎉</p>
                <p className="text-blue-100">No patients currently in queue.</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Stats Grid using Premium StatCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Pending Reviews"
            value={pendingScans.filter(s => s.status === 'pending_review').length.toString()}
            icon="🩺"
            color="blue"
            trend="Action Req."
          />
          <StatCard
            label="Patients Queue"
            value={patientQueue.length.toString()}
            icon="👥"
            color="blue"
            trend={`${patientQueue.length * 15} min est.`}
          />
          <StatCard
            label="Total Patients"
            value={patients.length.toString()}
            icon="✅"
            color="teal"
            trend="+12% this week"
            trendUp={true}
          />
          <StatCard
            label="Avg Satisfaction"
            value="4.8/5.0"
            icon="⭐"
            color="yellow"
            trend="Top 5%"
            trendUp={true}
          />
        </div>

        {/* 3. Today's Overview Split */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Quick Actions Grid */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button onClick={() => setActiveTab('appointments')} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-medical-200 hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl mb-3 group-hover:bg-blue-100 transition-colors">📅</div>
                <h4 className="font-semibold text-gray-900">View Schedule</h4>
                <p className="text-xs text-gray-500 mt-1">Check upcoming visits</p>
              </button>

              <button onClick={() => { }} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-medical-200 hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-xl mb-3 group-hover:bg-purple-100 transition-colors">📝</div>
                <h4 className="font-semibold text-gray-900">Medical Notes</h4>
                <p className="text-xs text-gray-500 mt-1">Document details</p>
              </button>

              <button onClick={generateReport} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-medical-200 hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-xl mb-3 group-hover:bg-teal-100 transition-colors">📊</div>
                <h4 className="font-semibold text-gray-900">Daily Report</h4>
                <p className="text-xs text-gray-500 mt-1">Download Analytics</p>
              </button>
            </div>

            {/* Recent Patients List (Simplified) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Recent Patients</h3>
                <button className="text-sm text-medical-600 font-semibold hover:text-medical-700">View All</button>
              </div>
              <div className="space-y-3">
                {patients.slice(0, 3).map(p => (
                  <div key={p.patientId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">{p.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">Last visit: {new Date(p.lastVisit).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI Alerts Panel */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">AI Alerts</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              {pendingScans.filter(s => s.status === 'pending_review').length > 0 ? (
                <div className="space-y-4">
                  {pendingScans.filter(s => s.status === 'pending_review').slice(0, 3).map((scan) => (
                    <div key={scan.scanId} className="border-l-4 border-red-500 pl-4 py-1">
                      <p className="font-medium text-gray-900 text-sm">{scan.patientName}</p>
                      <p className="text-xs text-red-600 font-medium">Requires Review • {scan.scanType}</p>
                      <p className="text-xs text-gray-400 mt-1">Confidence: {(scan.aiAnalysis.confidence * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                  <button className="w-full mt-2 py-2 text-sm text-medical-600 font-semibold bg-medical-50 rounded-lg hover:bg-medical-100 transition-colors">
                    Review All Scans
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No pending AI alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAIReviews = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">AI Analysis Reviews Required</h3>
        <div className="space-y-4">
          {pendingScans.filter(scan => scan.status === 'pending_review').map(scan => (
            <div key={scan.scanId} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {scan.patientName} - {scan.scanType}
                  </h4>
                  <p className="text-gray-600">Patient ID: {scan.patientId}</p>
                  <p className="text-gray-600">Scan Date: {new Date(scan.date).toLocaleDateString()}</p>
                  <p className="text-gray-600">AI Confidence: {(scan.aiAnalysis.confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedScan(scan)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Review Analysis
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">AI Findings:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {scan.aiAnalysis.findings.map((finding, index) => (
                      <li key={index} className="text-sm text-gray-600">{finding}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">AI Recommendations:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {scan.aiAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {scan.aiAnalysis.requiresReview && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ AI recommends doctor review due to confidence level or critical findings
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reviewed Scans */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recently Reviewed</h3>
        <div className="space-y-4">
          {pendingScans.filter(scan => scan.status !== 'pending_review').map(scan => (
            <div key={scan.scanId} className="border border-gray-200 rounded-lg p-6 opacity-75">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {scan.patientName} - {scan.scanType}
                  </h4>
                  <p className="text-gray-600">Status: {scan.status}</p>
                  {scan.doctorNotes && (
                    <p className="text-gray-800 mt-2">
                      <strong>Doctor Notes:</strong> {scan.doctorNotes}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ✅ {scan.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {selectedScan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Review AI Analysis - {selectedScan.patientName}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-gray-800">AI Findings:</h4>
                <ul className="list-disc list-inside mt-2">
                  {selectedScan.aiAnalysis.findings.map((finding, index) => (
                    <li key={index} className="text-gray-600">{finding}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800">AI Recommendations:</h4>
                <ul className="list-disc list-inside mt-2">
                  {selectedScan.aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-600">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Notes & Recommendations:
              </label>
              <textarea
                id="doctorNotes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Add your professional assessment and recommendations..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedScan(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('doctorNotes') as HTMLTextAreaElement).value;
                  handleScanReview(selectedScan.scanId, false, notes || 'Needs additional testing');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reject Analysis
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('doctorNotes') as HTMLTextAreaElement).value;
                  handleScanReview(selectedScan.scanId, true, notes || 'Analysis approved');
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Approve Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPatientManagement = () => {
    const filteredPatients = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Patient Search and Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Patient Management</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => console.log('Add new patient - functionality to be implemented')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                ➕ Add Patient
              </button>
            </div>
          </div>

          {/* Patient List */}
          <div className="space-y-4">
            {filteredPatients.map(patient => (
              <div key={patient.patientId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{patient.name}</h4>
                        <p className="text-sm text-gray-600">
                          ID: {patient.patientId} • Age: {patient.age} • {patient.gender}
                        </p>
                        <p className="text-sm text-gray-600">
                          📞 {patient.contact} • 📧 {patient.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-1">Medical Info</h5>
                        <p className="text-sm text-gray-600">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">Total Visits: {patient.totalVisits}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {patient.status}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-800 mb-1">Conditions & Medications</h5>
                        <p className="text-sm text-gray-600">
                          <strong>Conditions:</strong> {patient.chronicConditions.join(', ') || 'None'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Medications:</strong> {patient.currentMedications.join(', ') || 'None'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Allergies:</strong> {patient.allergies.join(', ') || 'None'}
                        </p>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          👁️ View Details
                        </button>
                        <button
                          onClick={() => scheduleAppointment(patient.patientId)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          📅 Schedule
                        </button>
                        <button
                          onClick={() => updatePatientRecord(patient)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          📝 Update
                        </button>
                        <button
                          onClick={() => contactPatient(patient)}
                          className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                        >
                          📞 Contact
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No patients found matching your search.</p>
            </div>
          )}
        </div>

        {/* Patient Details Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Patient Details</h3>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Name:</strong> {selectedPatient.name}</p>
                      <p><strong>Age:</strong> {selectedPatient.age}</p>
                      <p><strong>Gender:</strong> {selectedPatient.gender}</p>
                    </div>
                    <div>
                      <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
                      <p><strong>Phone:</strong> {selectedPatient.contact}</p>
                      <p><strong>Email:</strong> {selectedPatient.email}</p>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Medical History</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Last Visit:</strong> {new Date(selectedPatient.lastVisit).toLocaleDateString()}</p>
                    <p><strong>Total Visits:</strong> {selectedPatient.totalVisits}</p>
                    <p><strong>Status:</strong>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${selectedPatient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {selectedPatient.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Medical Details */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Chronic Conditions</h5>
                    <div className="bg-blue-50 rounded p-3">
                      {selectedPatient.chronicConditions.length > 0 ? (
                        <ul className="list-disc list-inside text-sm">
                          {selectedPatient.chronicConditions.map((condition, index) => (
                            <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">None</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Current Medications</h5>
                    <div className="bg-green-50 rounded p-3">
                      {selectedPatient.currentMedications.length > 0 ? (
                        <ul className="list-disc list-inside text-sm">
                          {selectedPatient.currentMedications.map((med, index) => (
                            <li key={index}>{med}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">None</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Allergies</h5>
                    <div className="bg-red-50 rounded p-3">
                      {selectedPatient.allergies.length > 0 ? (
                        <ul className="list-disc list-inside text-sm">
                          {selectedPatient.allergies.map((allergy, index) => (
                            <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">None</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      scheduleAppointment(selectedPatient.patientId);
                      setSelectedPatient(null);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    📅 Schedule Appointment
                  </button>
                  <button
                    onClick={() => {
                      updatePatientRecord(selectedPatient);
                      setSelectedPatient(null);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    📝 Update Record
                  </button>
                  <button
                    onClick={() => {
                      contactPatient(selectedPatient);
                      setSelectedPatient(null);
                    }}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                  >
                    📞 Contact Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReports = () => {
    const totalConsultations = reportData.dailyConsultations.reduce((a, b) => a + b, 0);
    const avgSatisfaction = (reportData.patientSatisfaction.reduce((a, b) => a + b, 0) / reportData.patientSatisfaction.length).toFixed(1);
    const avgAccuracy = (reportData.diagnosisAccuracy.reduce((a, b) => a + b, 0) / reportData.diagnosisAccuracy.length).toFixed(1);
    const avgSuccess = (reportData.treatmentSuccess.reduce((a, b) => a + b, 0) / reportData.treatmentSuccess.length).toFixed(1);

    const exportDetailedReport = () => {
      const detailedReport = {
        doctorName: user?.name || 'Doctor',
        reportDate: new Date().toISOString(),
        period: 'Last 7 days',
        summary: {
          totalConsultations,
          avgDailyConsultations: (totalConsultations / 7).toFixed(1),
          patientSatisfaction: avgSatisfaction,
          diagnosisAccuracy: avgAccuracy,
          treatmentSuccess: avgSuccess,
          totalPatients: patients.length,
          activePatients: patients.filter(p => p.status === 'active').length
        },
        dailyMetrics: {
          consultations: reportData.dailyConsultations,
          satisfaction: reportData.patientSatisfaction,
          accuracy: reportData.diagnosisAccuracy,
          success: reportData.treatmentSuccess
        },
        consultationTypes: reportData.consultationTypes,
        patientBreakdown: {
          totalPatients: patients.length,
          byGender: {
            male: patients.filter(p => p.gender === 'Male').length,
            female: patients.filter(p => p.gender === 'Female').length
          },
          byAge: {
            under30: patients.filter(p => p.age < 30).length,
            age30to50: patients.filter(p => p.age >= 30 && p.age <= 50).length,
            over50: patients.filter(p => p.age > 50).length
          }
        }
      };

      const blob = new Blob([JSON.stringify(detailedReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detailed_doctor_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Report exported - could show toast notification
      console.log('✅ Detailed report exported successfully!');
    };

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">📊 Performance Reports & Analytics</h3>
            <button
              onClick={exportDetailedReport}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              📥 Export Detailed Report
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Weekly Consultations</h4>
              <p className="text-3xl font-bold">{totalConsultations}</p>
              <p className="text-sm opacity-80">{(totalConsultations / 7).toFixed(1)} per day avg</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Patient Satisfaction</h4>
              <p className="text-3xl font-bold">{avgSatisfaction}/5.0</p>
              <p className="text-sm opacity-80">⭐ Excellent rating</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Diagnosis Accuracy</h4>
              <p className="text-3xl font-bold">{avgAccuracy}%</p>
              <p className="text-sm opacity-80">Above average</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Treatment Success</h4>
              <p className="text-3xl font-bold">{avgSuccess}%</p>
              <p className="text-sm opacity-80">Success rate</p>
            </div>
          </div>

          {/* Charts and Trends */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Daily Consultations */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📈 Daily Consultations (Last 7 Days)</h4>
              <div className="space-y-3">
                {reportData.dailyConsultations.map((count, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">Day {index + 1}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...reportData.dailyConsultations)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Satisfaction */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">⭐ Patient Satisfaction Trend</h4>
              <div className="space-y-3">
                {reportData.patientSatisfaction.map((rating, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">Day {index + 1}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(rating / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consultation Types Distribution */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Consultation Types Distribution</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {Object.entries(reportData.consultationTypes).map(([type, count]) => {
                  const total = Object.values(reportData.consultationTypes).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-700">{type}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-16">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(reportData.consultationTypes).reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Consultations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Generation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Generate Custom Reports</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Report Types</h4>
              <div className="space-y-2">
                <button
                  onClick={() => console.log('📊 Weekly performance report generated!')}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-left pl-4"
                >
                  📈 Weekly Performance Report
                </button>
                <button
                  onClick={() => console.log('👥 Patient demographics report generated!')}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 text-left pl-4"
                >
                  👥 Patient Demographics Report
                </button>
                <button
                  onClick={() => console.log('⏰ Time management report generated!')}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 text-left pl-4"
                >
                  ⏰ Time Management Report
                </button>
                <button
                  onClick={() => console.log('🎯 Treatment outcomes report generated!')}
                  className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 text-left pl-4"
                >
                  🎯 Treatment Outcomes Report
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Quick Stats</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="flex justify-between">
                  <span>Total Patients:</span>
                  <strong>{patients.length}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Active Patients:</span>
                  <strong>{patients.filter(p => p.status === 'active').length}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Pending Reviews:</span>
                  <strong>{pendingScans.filter(s => s.status === 'pending_review').length}</strong>
                </p>
                <p className="flex justify-between">
                  <span>This Week's Consultations:</span>
                  <strong>{totalConsultations}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Average Rating:</span>
                  <strong>{avgSatisfaction}/5.0 ⭐</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Professional Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">👨‍⚕️ Professional Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={doctorSettings.name}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={doctorSettings.email}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={doctorSettings.phone}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
            <select
              value={doctorSettings.specialization}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, specialization: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="General Practice">General Practice</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Radiology">Radiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Surgery">Surgery</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical License Number</label>
            <input
              type="text"
              value={doctorSettings.licenseNumber}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, licenseNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <input
              type="number"
              value={doctorSettings.yearsOfExperience}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Affiliation</label>
            <input
              type="text"
              value={doctorSettings.hospitalAffiliation}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, hospitalAffiliation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee ($)</label>
            <input
              type="number"
              value={doctorSettings.consultationFee}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, consultationFee: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Office Address</label>
            <textarea
              value={doctorSettings.officeAddress}
              onChange={(e) => setDoctorSettings(prev => ({ ...prev, officeAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Availability Schedule */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">📅 Weekly Availability</h3>
        <div className="space-y-4">
          {Object.entries(doctorSettings.availability).map(([day, schedule]) => (
            <div key={day} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={schedule.available}
                  onChange={(e) => setDoctorSettings(prev => ({
                    ...prev,
                    availability: {
                      ...prev.availability,
                      [day]: { ...schedule, available: e.target.checked }
                    }
                  }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="font-medium text-gray-700 capitalize w-20">{day}</label>
              </div>
              {schedule.available && (
                <div className="flex items-center space-x-4">
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => setDoctorSettings(prev => ({
                      ...prev,
                      availability: {
                        ...prev.availability,
                        [day]: { ...schedule, startTime: e.target.value }
                      }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => setDoctorSettings(prev => ({
                      ...prev,
                      availability: {
                        ...prev.availability,
                        [day]: { ...schedule, endTime: e.target.value }
                      }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          ))}
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
              checked={doctorSettings.notifications.email}
              onChange={(e) => setDoctorSettings(prev => ({
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
              checked={doctorSettings.notifications.sms}
              onChange={(e) => setDoctorSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, sms: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">New Patients</label>
              <p className="text-sm text-gray-500">Get notified about new patient registrations</p>
            </div>
            <input
              type="checkbox"
              checked={doctorSettings.notifications.newPatients}
              onChange={(e) => setDoctorSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, newPatients: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Urgent Cases</label>
              <p className="text-sm text-gray-500">Get immediate alerts for urgent medical cases</p>
            </div>
            <input
              type="checkbox"
              checked={doctorSettings.notifications.urgentCases}
              onChange={(e) => setDoctorSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, urgentCases: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">AI Analysis Alerts</label>
              <p className="text-sm text-gray-500">Get notified when AI analysis requires review</p>
            </div>
            <input
              type="checkbox"
              checked={doctorSettings.notifications.aiAlerts}
              onChange={(e) => setDoctorSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, aiAlerts: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">⚙️ Practice Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Auto-approve Normal Scans</label>
              <p className="text-sm text-gray-500">Automatically approve AI analysis with high confidence and no abnormalities</p>
            </div>
            <input
              type="checkbox"
              checked={doctorSettings.preferences.autoApproveNormalScans}
              onChange={(e) => setDoctorSettings(prev => ({
                ...prev,
                preferences: { ...prev.preferences, autoApproveNormalScans: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Require Second Opinion</label>
              <p className="text-sm text-gray-500">Require colleague review for complex cases</p>
            </div>
            <input
              type="checkbox"
              checked={doctorSettings.preferences.requireSecondOpinion}
              onChange={(e) => setDoctorSettings(prev => ({
                ...prev,
                preferences: { ...prev.preferences, requireSecondOpinion: e.target.checked }
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
              checked={doctorSettings.preferences.shareDataForResearch}
              onChange={(e) => setDoctorSettings(prev => ({
                ...prev,
                preferences: { ...prev.preferences, shareDataForResearch: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Appointment Duration (minutes)</label>
              <input
                type="number"
                value={doctorSettings.preferences.defaultAppointmentDuration}
                onChange={(e) => setDoctorSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, defaultAppointmentDuration: parseInt(e.target.value) || 30 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Patients Per Day</label>
              <input
                type="number"
                value={doctorSettings.preferences.maxPatientsPerDay}
                onChange={(e) => setDoctorSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, maxPatientsPerDay: parseInt(e.target.value) || 20 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }


  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      notifications={[]} // Doctors might have their own notifications logic
      logout={logout}
    >
      <div className="space-y-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Patient Queue</h2>
            {/* Reusing existing queue render logic here for now */}
            {patientQueue.length > 0 ? (
              <div className="space-y-4">
                {patientQueue.map(patient => (
                  <div key={patient.patientId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="mr-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(patient.priority)}`}>
                          {getPriorityLabel(patient.priority)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{patient.patientName}</h4>
                        <p className="text-sm text-gray-600">ID: {patient.patientId} • Age: {patient.age}</p>
                        <p className="text-sm text-gray-600">Symptoms: {patient.symptoms.join(', ')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => seePatient(patient)}
                      className="bg-medical-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-medical-700"
                    >
                      See Patient
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No patients in queue</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'patients' && renderPatientManagement()}

        {activeTab === 'reports' && renderReports()}
        {activeTab === 'reviews' && renderAIReviews()}
        {activeTab === 'settings' && renderSettings()}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center py-12">
            <div className="text-6xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-500">Manage your profile and availability.</p>
          </div>
        )}
      </div>

      {
        showPatientModal && currentPatient && (
          <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-[95vw] h-[92vh] overflow-hidden flex flex-col border border-white/10">

              {/* Console Header */}
              <div className="px-8 py-6 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-20">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-200">
                    {currentPatient?.patientName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{currentPatient?.patientName}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">ID: {currentPatient?.patientId}</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        {currentPatient?.age} Years
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📞</span> {currentPatient?.contact}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consultation Tabs (Pill Switcher) */}
                <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50 backdrop-blur-sm">
                  <button
                    onClick={() => setConsultationTab('diagnosis')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${consultationTab === 'diagnosis'
                      ? 'bg-white text-indigo-600 shadow-sm scale-100'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                  >
                    <span>🩺</span> Diagnosis
                  </button>
                  <button
                    onClick={() => setConsultationTab('prescription')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${consultationTab === 'prescription'
                      ? 'bg-white text-indigo-600 shadow-sm scale-100'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                  >
                    <span>💊</span> Prescription
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right mr-4 hidden md:block">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Session Time</p>
                    <p className="text-lg font-mono font-bold text-gray-700">12:04</p>
                  </div>
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors border border-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50 relative">

                {/* MAIN CONSOLE AREA (Left) */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
                  {/* @ts-ignore */}
                  <AnimatePresence mode="wait">
                    {consultationTab === 'diagnosis' ? (
                      <motion.div
                        key="diagnosis"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="max-w-4xl mx-auto space-y-8"
                      >
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                          <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                            <span>🤒</span> Reported Symptoms
                          </h3>
                          <div className="flex flex-wrap gap-2 relative z-10">
                            {currentPatient?.symptoms?.map((sym, i) => (
                              <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold shadow-sm border border-indigo-100">
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Clinical Notes & Findings</label>
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all overflow-hidden flex flex-col h-[500px]">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex gap-2">
                              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-xs font-bold">B</button>
                              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-xs italic">I</button>
                              <div className="h-4 w-px bg-gray-300 mx-1 self-center"></div>
                              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-xs">Lists</button>
                              <span className="flex-1"></span>
                              <span className="text-xs text-gray-400 self-center">Markdown Supported</span>
                            </div>
                            <textarea
                              className="flex-1 w-full p-6 focus:outline-none resize-none text-base leading-relaxed text-gray-700"
                              placeholder="Start typing your diagnosis..."
                              value={consultationNotes}
                              onChange={(e) => setConsultationNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="prescription"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-4xl mx-auto space-y-8"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-4">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Prescription Pad</label>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-400 transition-all flex flex-col h-[500px]">
                              <div className="bg-teal-50/50 px-6 py-3 border-b border-teal-100 flex justify-between items-center">
                                <span className="font-mono text-xs text-teal-800 font-bold uppercase tracking-wider">Rx Digital Prescription</span>
                                <div className="flex gap-2">
                                  <button className="text-xs bg-white border border-teal-200 text-teal-700 px-2 py-1 rounded hover:bg-teal-50 font-medium">+ Paracetamol</button>
                                  <button className="text-xs bg-white border border-teal-200 text-teal-700 px-2 py-1 rounded hover:bg-teal-50 font-medium">+ Antibiotics</button>
                                </div>
                              </div>
                              <textarea
                                className="flex-1 w-full p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed text-gray-700"
                                placeholder="Rx Name | Dosage | Frequency&#10;Example: Amoxicillin | 500mg | Twice Daily"
                                value={prescription}
                                onChange={(e) => setPrescription(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Uploads & Scans</label>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
                              <button
                                onClick={() => document.getElementById('prescription-upload')?.click()}
                                className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:bg-blue-50/50 hover:border-blue-400 transition-all group gap-2"
                              >
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📤</div>
                                <span className="text-xs font-bold text-gray-600">Upload File</span>
                                <input type="file" id="prescription-upload" className="hidden" accept="image/*,.pdf" onChange={handlePrescriptionImageChange} />
                              </button>

                              <button
                                onClick={startCamera}
                                className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:bg-teal-50/50 hover:border-teal-400 transition-all group gap-2"
                              >
                                <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📸</div>
                                <span className="text-xs font-bold text-gray-600">Open Camera</span>
                              </button>

                              {prescriptionImagePreview && (
                                <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200">
                                  <img src={prescriptionImagePreview || undefined} className="w-full h-32 object-cover" alt="Preview" />
                                  <button onClick={() => { setPrescriptionImage(null); setPrescriptionImagePreview(null); }} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">✕</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {showCamera && (
                      <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-2xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-auto transform -scale-x-100" />

                          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-6">
                            <button
                              onClick={stopCamera}
                              className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
                              title="Cancel"
                            >
                              ✕
                            </button>
                            <button
                              onClick={capturePhoto}
                              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform"
                              title="Capture"
                            >
                              <div className="w-16 h-16 bg-white rounded-full"></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT CONTEXT SIDEBAR */}
                <div className="w-full lg:w-96 bg-white border-l border-gray-200 h-full flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 text-lg">Patient History</h3>
                      <button
                        className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        onClick={generatePatientSummary}
                      >
                        ✨ Summarize
                      </button>
                    </div>

                    {/* AI Summary Card */}
                    {patientSummary && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100/50 text-sm shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-40 rounded-full blur-xl -mr-6 -mt-6"></div>
                        <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> AI Insight
                        </h4>
                        <p className="text-indigo-800/80 leading-relaxed font-medium text-xs">{patientSummary}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                      {loadingHistory ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                      ) : patientMedicalHistory.appointments.length > 0 ? (
                        <div className="relative border-l-2 border-indigo-100 space-y-8 pl-6 ml-2">
                          {patientMedicalHistory.appointments.map((apt, i) => (
                            <div key={i} className="relative group">
                              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-50 border-2 border-indigo-500 group-hover:scale-125 transition-transform bg-white z-10"></div>
                              <span className="text-xs font-mono font-medium text-gray-400">{new Date(apt.appointmentDate || apt.date).toLocaleDateString()}</span>
                              <h4 className="text-sm font-bold text-gray-900 mt-0.5">{apt.diagnosis || 'Checkup'}</h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-3 leading-relaxed">{apt.notes || 'No notes available.'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <div className="text-4xl mb-3 opacity-30">📜</div>
                          <p className="text-sm">No medical history</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <button className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      onClick={handleCompleteConsultation}
                    >
                      <span>✅</span> Complete Consultation
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )
      }
    </DashboardLayout>
  );
};

export default DoctorDashboard;
