import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  emailNotifications: boolean;
  smsAlerts: boolean;
  darkMode: boolean;
  autoSave: boolean;
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
    },
    emailNotifications: true,
    smsAlerts: true,
    darkMode: false,
    autoSave: true
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

  const loadDemoData = useCallback(() => {
    setPendingScans([
      {
        scanId: 'S001',
        patientName: 'John Smith',
        patientId: 'P001',
        scanType: 'Chest X-Ray',
        date: '2024-10-05',
        status: 'pending_review',
        aiAnalysis: {
          confidence: 0.87,
          findings: ['Possible pneumonia in left lower lobe', 'Elevated white blood cell markers'],
          recommendations: ['Antibiotic treatment recommended', 'Follow-up chest X-ray in 1 week'],
          requiresReview: true
        }
      },
      {
        scanId: 'S002',
        patientName: 'Maria Garcia',
        patientId: 'P002',
        scanType: 'Brain MRI',
        date: '2024-10-04',
        status: 'pending_review',
        aiAnalysis: {
          confidence: 0.95,
          findings: ['Small lesion detected in frontal cortex', 'No signs of hemorrhage'],
          recommendations: ['Neurological consultation required', 'Additional MRI with contrast in 3 months'],
          requiresReview: true
        }
      },
      {
        scanId: 'S003',
        patientName: 'Robert Johnson',
        patientId: 'P003',
        scanType: 'Bone X-Ray',
        date: '2024-10-03',
        status: 'reviewed',
        aiAnalysis: {
          confidence: 0.92,
          findings: ['Hairline fracture in radius bone', 'No displacement noted'],
          recommendations: ['Cast immobilization for 6 weeks', 'Physical therapy after cast removal'],
          requiresReview: false
        },
        doctorNotes: 'Confirmed fracture. Cast applied. Patient educated on care instructions.'
      }
    ]);

    setPatientQueue([
      {
        patientId: 'P004',
        patientName: 'Alice Brown',
        appointmentTime: '09:00 AM',
        priority: 5,
        symptoms: ['chest pain', 'shortness of breath'],
        waitTime: 15,
        contact: '+1-555-0104',
        age: 45
      },
      {
        patientId: 'P005',
        patientName: 'David Wilson',
        appointmentTime: '09:30 AM',
        priority: 3,
        symptoms: ['headache', 'dizziness'],
        waitTime: 45,
        contact: '+1-555-0105',
        age: 32
      },
      {
        patientId: 'P006',
        patientName: 'Emma Davis',
        appointmentTime: '10:00 AM',
        priority: 2,
        symptoms: ['routine checkup'],
        waitTime: 75,
        contact: '+1-555-0106',
        age: 28
      }
    ]);

    setPatients([
      {
        patientId: 'P001',
        name: 'John Smith',
        age: 45,
        gender: 'Male',
        contact: '+1-555-0101',
        email: 'john.smith@email.com',
        lastVisit: '2024-10-01',
        totalVisits: 12,
        chronicConditions: ['Hypertension', 'Diabetes Type 2'],
        currentMedications: ['Metformin', 'Lisinopril'],
        allergies: ['Penicillin'],
        status: 'active'
      },
      {
        patientId: 'P002',
        name: 'Maria Garcia',
        age: 32,
        gender: 'Female',
        contact: '+1-555-0102',
        email: 'maria.garcia@email.com',
        lastVisit: '2024-09-28',
        totalVisits: 8,
        chronicConditions: ['Migraine'],
        currentMedications: ['Sumatriptan'],
        allergies: ['Aspirin'],
        status: 'active'
      },
      {
        patientId: 'P003',
        name: 'Robert Johnson',
        age: 58,
        gender: 'Male',
        contact: '+1-555-0103',
        email: 'robert.johnson@email.com',
        lastVisit: '2024-10-03',
        totalVisits: 15,
        chronicConditions: ['Arthritis'],
        currentMedications: ['Ibuprofen'],
        allergies: ['None'],
        status: 'active'
      },
      {
        patientId: 'P004',
        name: 'Alice Brown',
        age: 28,
        gender: 'Female',
        contact: '+1-555-0104',
        email: 'alice.brown@email.com',
        lastVisit: '2024-09-15',
        totalVisits: 5,
        chronicConditions: ['None'],
        currentMedications: ['None'],
        allergies: ['Shellfish'],
        status: 'active'
      }
    ]);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Load doctor settings
      setDoctorSettings(prev => ({
        ...prev,
        name: parsedUser.name || 'Dr. Healthcare',
        email: parsedUser.email || 'doctor@healthcare.ai',
        phone: parsedUser.phone || '+1-555-1000',
        specialization: parsedUser.specialization || 'General Practice',
        licenseNumber: parsedUser.licenseNumber || 'MD123456',
        yearsOfExperience: parsedUser.yearsOfExperience || 10,
        hospitalAffiliation: parsedUser.hospitalAffiliation || 'Healthcare AI Hospital',
        officeAddress: parsedUser.officeAddress || '456 Medical Plaza, Healthcare City',
        consultationFee: parsedUser.consultationFee || 200
      }));
    } else {
      navigate('/login?role=doctor');
    }

    loadDemoData();
  }, [navigate, loadDemoData]);

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
    alert(approved ? '✅ AI analysis approved!' : '⚠️ Analysis marked for review');
  };

  const addMedicalNotes = () => {
    const patientName = window.prompt('Enter patient name:');
    if (!patientName) return;

    const notes = window.prompt(`Enter medical notes for ${patientName}:`);
    if (notes) {
      alert(`✅ Medical notes added for ${patientName}:\n\n"${notes}"\n\nNotes saved to patient record.`);
    }
  };

  const viewPerformanceMetrics = () => {
    const avgConsultations = (reportData.dailyConsultations.reduce((a, b) => a + b, 0) / reportData.dailyConsultations.length).toFixed(1);
    const avgSatisfaction = (reportData.patientSatisfaction.reduce((a, b) => a + b, 0) / reportData.patientSatisfaction.length).toFixed(1);
    const avgAccuracy = (reportData.diagnosisAccuracy.reduce((a, b) => a + b, 0) / reportData.diagnosisAccuracy.length).toFixed(1);

    alert(`📊 Your Performance Metrics:\n\n` +
      `Daily Consultations (avg): ${avgConsultations}\n` +
      `Patient Satisfaction: ${avgSatisfaction}/5.0\n` +
      `Diagnosis Accuracy: ${avgAccuracy}%\n` +
      `Total Patients: ${patients.length}\n` +
      `Pending Reviews: ${pendingScans.filter(s => s.status === 'pending_review').length}`);
  };

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

    alert('✅ Performance report downloaded successfully!');
  };

  const seePatient = (patient: PatientQueue) => {
    setPatientQueue(prev =>
      prev.map(p =>
        p.patientId === patient.patientId
          ? { ...p, waitTime: 0 }
          : p
      )
    );
    alert(`👨‍⚕️ Seeing patient: ${patient.patientName}\n\nSymptoms: ${patient.symptoms.join(', ')}\nPriority: ${patient.priority}/5\nContact: ${patient.contact}`);
  };

  const scheduleAppointment = (patientId: string) => {
    const patient = patients.find(p => p.patientId === patientId);
    const date = window.prompt('Enter appointment date (YYYY-MM-DD):');
    const time = window.prompt('Enter appointment time (HH:MM AM/PM):');

    if (date && time && patient) {
      alert(`✅ Appointment scheduled!\n\nPatient: ${patient.name}\nDate: ${date}\nTime: ${time}\n\nConfirmation sent to patient.`);
    }
  };

  const updatePatientRecord = (patient: Patient) => {
    const updates = window.prompt(`Update record for ${patient.name}:\n\nEnter new information (medications, conditions, notes):`);
    if (updates) {
      alert(`✅ Patient record updated!\n\nPatient: ${patient.name}\nUpdates: "${updates}"\n\nRecord saved successfully.`);
    }
  };

  const contactPatient = (patient: Patient) => {
    const contactMethod = window.prompt(`Contact ${patient.name}:\n\nType 'phone' to call or 'email' to send email:`);
    if (contactMethod?.toLowerCase() === 'phone') {
      alert(`📞 Calling ${patient.name} at ${patient.contact}...`);
    } else if (contactMethod?.toLowerCase() === 'email') {
      alert(`📧 Sending email to ${patient.name} at ${patient.email}...`);
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
    alert('✅ Settings saved successfully!');
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

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-[20px] p-8 text-white shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] relative overflow-hidden" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
        <div className="relative z-10">
          <h2 className="text-[32px] font-semibold tracking-[-1.6px] mb-2">Welcome back, {user.name}</h2>
          <p className="text-blue-100 text-lg">You have {pendingScans.filter(s => s.status === 'pending_review').length} pending reviews and {patientQueue.length} patients in queue today.</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-900 opacity-10 rounded-full blur-2xl transform -translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Doctor Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-red-50 flex items-center justify-center text-2xl">
              🩺
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Urgent</span>
          </div>
          <p className="text-sm font-medium text-[#7a7a7a]">Pending Reviews</p>
          <p className="text-[28px] font-bold text-[#0a0b10] mt-1">
            {pendingScans.filter(s => s.status === 'pending_review').length}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-blue-50 flex items-center justify-center text-2xl">
              👥
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Waiting</span>
          </div>
          <p className="text-sm font-medium text-[#7a7a7a]">Patients in Queue</p>
          <p className="text-[28px] font-bold text-[#0a0b10] mt-1">{patientQueue.length}</p>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-green-50 flex items-center justify-center text-2xl">
              ✅
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-sm font-medium text-[#7a7a7a]">Total Patients</p>
          <p className="text-[28px] font-bold text-[#0a0b10] mt-1">{patients.length}</p>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-purple-50 flex items-center justify-center text-2xl">
              🎯
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Rating</span>
          </div>
          <p className="text-sm font-medium text-[#7a7a7a]">Avg Satisfaction</p>
          <p className="text-[28px] font-bold text-[#0a0b10] mt-1">
            {(reportData.patientSatisfaction.reduce((a, b) => a + b, 0) / reportData.patientSatisfaction.length).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Patient Queue */}
      <div className="bg-white rounded-[20px] p-8 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Patient Queue</h3>
          <span className="text-sm font-medium text-[#7a7a7a]">Priority-Based</span>
        </div>
        <div className="space-y-3">
          {patientQueue.sort((a, b) => b.priority - a.priority).map(patient => (
            <div key={patient.patientId} className="flex items-center justify-between p-5 bg-[#f8f9fa] rounded-[16px] border border-gray-100 hover:border-gray-200 transition-all">
              <div className="flex items-center">
                <div className="mr-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getPriorityColor(patient.priority)}`}>
                    {getPriorityLabel(patient.priority)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0a0b10] text-[16px]">{patient.patientName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#7a7a7a] bg-white px-2 py-0.5 rounded border border-gray-100">ID: {patient.patientId}</span>
                    <span className="text-xs text-[#7a7a7a]">Age: {patient.age}</span>
                  </div>
                  <p className="text-sm text-[#7a7a7a] mt-1">Symptoms: {patient.symptoms.join(', ')}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="text-sm font-medium text-[#0a0b10]">{patient.appointmentTime}</div>
                <div className="text-xs text-[#7a7a7a]">Wait: {patient.waitTime} min</div>
                <button
                  onClick={() => seePatient(patient)}
                  className="mt-1 px-4 py-2 rounded-[8px] text-sm font-medium text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
                  style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
                >
                  See Patient
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all text-center group cursor-pointer" onClick={addMedicalNotes}>
          <div className="w-14 h-14 rounded-[16px] bg-green-50 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">📝</div>
          <h3 className="text-[18px] font-semibold text-[#0a0b10] mb-2">Add Medical Notes</h3>
          <p className="text-[#7a7a7a] text-sm mb-4">Document patient consultations and treatments</p>
          <span className="text-green-600 font-medium text-sm">Add Notes →</span>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all text-center group cursor-pointer" onClick={viewPerformanceMetrics}>
          <div className="w-14 h-14 rounded-[16px] bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">📊</div>
          <h3 className="text-[18px] font-semibold text-[#0a0b10] mb-2">Performance Metrics</h3>
          <p className="text-[#7a7a7a] text-sm mb-4">View your diagnostic accuracy and patient feedback</p>
          <span className="text-[#1B44FE] font-medium text-sm">View Metrics →</span>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all text-center group cursor-pointer" onClick={generateReport}>
          <div className="w-14 h-14 rounded-[16px] bg-purple-50 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">📱</div>
          <h3 className="text-[18px] font-semibold text-[#0a0b10] mb-2">Generate Report</h3>
          <p className="text-[#7a7a7a] text-sm mb-4">Create comprehensive patient reports</p>
          <span className="text-purple-600 font-medium text-sm">Generate →</span>
        </div>
      </div>
    </div>
  );

  const renderAIReviews = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">AI Analysis Reviews Required</h3>
        <div className="space-y-4">
          {pendingScans.filter(scan => scan.status === 'pending_review').map(scan => (
            <div key={scan.scanId} className="border border-gray-100 rounded-[16px] p-6 hover:border-gray-200 transition-all bg-[#f8f9fa]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-1">
                    {scan.patientName} - {scan.scanType}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-[#7a7a7a]">
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-100">ID: {scan.patientId}</span>
                    <span>•</span>
                    <span>{new Date(scan.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium text-[#0a0b10]">AI Confidence:</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1B44FE] rounded-full"
                        style={{ width: `${scan.aiAnalysis.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-[#1B44FE]">{(scan.aiAnalysis.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedScan(scan)}
                  className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
                  style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
                >
                  Review Analysis
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 bg-white rounded-[12px] p-5 border border-gray-100">
                <div>
                  <h5 className="font-semibold text-[#0a0b10] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    AI Findings
                  </h5>
                  <ul className="space-y-2">
                    {scan.aiAnalysis.findings.map((finding, index) => (
                      <li key={index} className="text-sm text-[#7a7a7a] flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-[#0a0b10] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    AI Recommendations
                  </h5>
                  <ul className="space-y-2">
                    {scan.aiAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-[#7a7a7a] flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {scan.aiAnalysis.requiresReview && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-[12px] p-4 flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="text-yellow-800 font-medium text-sm">
                    AI recommends doctor review due to confidence level or critical findings
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reviewed Scans */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">Recently Reviewed</h3>
        <div className="space-y-4">
          {pendingScans.filter(scan => scan.status !== 'pending_review').map(scan => (
            <div key={scan.scanId} className="border border-gray-100 rounded-[16px] p-6 opacity-75 hover:opacity-100 transition-all bg-[#f8f9fa]">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-1">
                    {scan.patientName} - {scan.scanType}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-[#7a7a7a]">Status:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">
                      {scan.status.replace('_', ' ')}
                    </span>
                  </div>
                  {scan.doctorNotes && (
                    <div className="bg-white p-3 rounded-[8px] border border-gray-100 inline-block">
                      <p className="text-sm text-[#0a0b10]">
                        <span className="font-medium text-[#7a7a7a] mr-2">Notes:</span>
                        {scan.doctorNotes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">
                  ✅
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {selectedScan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-[24px] font-bold text-[#0a0b10] mb-2 tracking-[-0.8px]">
              Review AI Analysis
            </h3>
            <p className="text-[#7a7a7a] mb-6">Patient: {selectedScan.patientName} • ID: {selectedScan.patientId}</p>

            <div className="space-y-6 mb-8">
              <div className="bg-[#f8f9fa] rounded-[16px] p-6 border border-gray-100">
                <h4 className="font-semibold text-[#0a0b10] mb-3">AI Findings</h4>
                <ul className="space-y-2">
                  {selectedScan.aiAnalysis.findings.map((finding, index) => (
                    <li key={index} className="text-[#7a7a7a] text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#f8f9fa] rounded-[16px] p-6 border border-gray-100">
                <h4 className="font-semibold text-[#0a0b10] mb-3">AI Recommendations</h4>
                <ul className="space-y-2">
                  {selectedScan.aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-[#7a7a7a] text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-[#0a0b10] mb-2">
                Doctor Notes & Recommendations
              </label>
              <textarea
                id="doctorNotes"
                className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent outline-none transition-all resize-none text-sm"
                rows={4}
                placeholder="Add your professional assessment and recommendations..."
              />
            </div>

            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedScan(null)}
                className="px-6 py-2.5 border border-gray-200 rounded-[12px] text-sm font-medium text-[#7a7a7a] hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('doctorNotes') as HTMLTextAreaElement).value;
                  handleScanReview(selectedScan.scanId, false, notes || 'Needs additional testing');
                }}
                className="px-6 py-2.5 bg-red-50 text-red-600 rounded-[12px] text-sm font-medium hover:bg-red-100 transition-all"
              >
                Reject Analysis
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('doctorNotes') as HTMLTextAreaElement).value;
                  handleScanReview(selectedScan.scanId, true, notes || 'Analysis approved');
                }}
                className="px-6 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
                style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
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
      <div className="space-y-8">
        {/* Patient Search and Actions */}
        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Patient Management</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent outline-none w-64 text-sm"
              />
              <button
                onClick={() => alert('📝 Add new patient functionality would open here')}
                className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all flex items-center gap-2"
                style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
              >
                <span>➕</span> Add Patient
              </button>
            </div>
          </div>

          {/* Patient List */}
          <div className="space-y-4">
            {filteredPatients.map(patient => (
              <div key={patient.patientId} className="border border-gray-100 rounded-[16px] p-6 hover:border-gray-200 transition-all bg-[#f8f9fa]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-1">{patient.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-[#7a7a7a]">
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-100">ID: {patient.patientId}</span>
                          <span>•</span>
                          <span>{patient.age} years</span>
                          <span>•</span>
                          <span>{patient.gender}</span>
                        </div>
                        <div className="mt-2 text-sm text-[#7a7a7a] flex items-center gap-4">
                          <span className="flex items-center gap-1">📞 {patient.contact}</span>
                          <span className="flex items-center gap-1">📧 {patient.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid md:grid-cols-3 gap-6">
                      <div className="bg-white p-4 rounded-[12px] border border-gray-100">
                        <h5 className="font-medium text-[#0a0b10] mb-2 text-sm">Medical Info</h5>
                        <p className="text-sm text-[#7a7a7a]">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                        <p className="text-sm text-[#7a7a7a]">Total Visits: {patient.totalVisits}</p>
                        <span className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                        </span>
                      </div>

                      <div className="bg-white p-4 rounded-[12px] border border-gray-100 md:col-span-2">
                        <h5 className="font-medium text-[#0a0b10] mb-2 text-sm">Conditions & Medications</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-[#7a7a7a] uppercase tracking-wider mb-1">Conditions</p>
                            <p className="text-sm text-[#0a0b10]">{patient.chronicConditions.join(', ') || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#7a7a7a] uppercase tracking-wider mb-1">Medications</p>
                            <p className="text-sm text-[#0a0b10]">{patient.currentMedications.join(', ') || 'None'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-[#0a0b10] hover:bg-gray-50 transition-all"
                      >
                        👁️ View Details
                      </button>
                      <button
                        onClick={() => scheduleAppointment(patient.patientId)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-[#0a0b10] hover:bg-gray-50 transition-all"
                      >
                        📅 Schedule
                      </button>
                      <button
                        onClick={() => updatePatientRecord(patient)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-[#0a0b10] hover:bg-gray-50 transition-all"
                      >
                        📝 Update
                      </button>
                      <button
                        onClick={() => contactPatient(patient)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-[#0a0b10] hover:bg-gray-50 transition-all"
                      >
                        📞 Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-16 bg-[#f8f9fa] rounded-[20px] border border-dashed border-gray-200">
              <p className="text-[#7a7a7a]">No patients found matching your search.</p>
            </div>
          )}
        </div>

        {/* Patient Details Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[24px] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[24px] font-bold text-[#0a0b10] tracking-[-0.8px]">Patient Details</h3>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-[#7a7a7a] hover:text-[#0a0b10] text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Info */}
                <div>
                  <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-4 border-b border-gray-100 pb-2">Basic Information</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-[#7a7a7a]">Name:</span> <span className="font-medium text-[#0a0b10] ml-2">{selectedPatient.name}</span></p>
                      <p className="text-sm"><span className="text-[#7a7a7a]">Age:</span> <span className="font-medium text-[#0a0b10] ml-2">{selectedPatient.age}</span></p>
                      <p className="text-sm"><span className="text-[#7a7a7a]">Gender:</span> <span className="font-medium text-[#0a0b10] ml-2">{selectedPatient.gender}</span></p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-[#7a7a7a]">Patient ID:</span> <span className="font-medium text-[#0a0b10] ml-2">{selectedPatient.patientId}</span></p>
                      <p className="text-sm"><span className="text-[#7a7a7a]">Phone:</span> <span className="font-medium text-[#0a0b10] ml-2">{selectedPatient.contact}</span></p>
                      <p className="text-sm"><span className="text-[#7a7a7a]">Email:</span> <span className="font-medium text-[#0a0b10] ml-2">{selectedPatient.email}</span></p>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-4 border-b border-gray-100 pb-2">Medical History</h4>
                  <div className="bg-[#f8f9fa] rounded-[16px] p-6 border border-gray-100 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#7a7a7a] uppercase tracking-wider mb-1">Last Visit</p>
                      <p className="font-medium text-[#0a0b10]">{new Date(selectedPatient.lastVisit).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#7a7a7a] uppercase tracking-wider mb-1">Total Visits</p>
                      <p className="font-medium text-[#0a0b10]">{selectedPatient.totalVisits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#7a7a7a] uppercase tracking-wider mb-1">Status</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedPatient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical Details */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h5 className="font-medium text-[#0a0b10] mb-3">Chronic Conditions</h5>
                    <div className="bg-blue-50 rounded-[12px] p-4 h-full">
                      {selectedPatient.chronicConditions.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
                          {selectedPatient.chronicConditions.map((condition, index) => (
                            <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-blue-700">None</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-[#0a0b10] mb-3">Current Medications</h5>
                    <div className="bg-green-50 rounded-[12px] p-4 h-full">
                      {selectedPatient.currentMedications.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
                          {selectedPatient.currentMedications.map((med, index) => (
                            <li key={index}>{med}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-700">None</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-[#0a0b10] mb-3">Allergies</h5>
                    <div className="bg-red-50 rounded-[12px] p-4 h-full">
                      {selectedPatient.allergies.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
                          {selectedPatient.allergies.map((allergy, index) => (
                            <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-red-700">None</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      scheduleAppointment(selectedPatient.patientId);
                      setSelectedPatient(null);
                    }}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-[12px] text-sm font-medium text-[#0a0b10] hover:bg-gray-50 transition-all shadow-sm"
                  >
                    📅 Schedule Appointment
                  </button>
                  <button
                    onClick={() => {
                      updatePatientRecord(selectedPatient);
                      setSelectedPatient(null);
                    }}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-[12px] text-sm font-medium text-[#0a0b10] hover:bg-gray-50 transition-all shadow-sm"
                  >
                    📝 Update Record
                  </button>
                  <button
                    onClick={() => {
                      contactPatient(selectedPatient);
                      setSelectedPatient(null);
                    }}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-[12px] text-sm font-medium text-[#0a0b10] hover:bg-gray-50 transition-all shadow-sm"
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

      alert('✅ Detailed report exported successfully!');
    };

    return (
      <div className="space-y-8">
        {/* Performance Overview */}
        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px]">📊 Performance Reports & Analytics</h3>
            <button
              onClick={exportDetailedReport}
              className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all flex items-center gap-2"
              style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
            >
              <span>📥</span> Export Detailed Report
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[20px] shadow-lg shadow-blue-200">
              <h4 className="text-lg font-semibold mb-2 opacity-90">Weekly Consultations</h4>
              <p className="text-4xl font-bold mb-1">{totalConsultations}</p>
              <p className="text-sm opacity-80">{(totalConsultations / 7).toFixed(1)} per day avg</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-[20px] shadow-lg shadow-green-200">
              <h4 className="text-lg font-semibold mb-2 opacity-90">Patient Satisfaction</h4>
              <p className="text-4xl font-bold mb-1">{avgSatisfaction}/5.0</p>
              <p className="text-sm opacity-80">⭐ Excellent rating</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-[20px] shadow-lg shadow-purple-200">
              <h4 className="text-lg font-semibold mb-2 opacity-90">Diagnosis Accuracy</h4>
              <p className="text-4xl font-bold mb-1">{avgAccuracy}%</p>
              <p className="text-sm opacity-80">Above average</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-[20px] shadow-lg shadow-orange-200">
              <h4 className="text-lg font-semibold mb-2 opacity-90">Treatment Success</h4>
              <p className="text-4xl font-bold mb-1">{avgSuccess}%</p>
              <p className="text-sm opacity-80">Success rate</p>
            </div>
          </div>

          {/* Charts and Trends */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Daily Consultations */}
            <div className="bg-[#f8f9fa] rounded-[20px] p-6 border border-gray-100">
              <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-6">📈 Daily Consultations (Last 7 Days)</h4>
              <div className="space-y-4">
                {reportData.dailyConsultations.map((count, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#7a7a7a] w-12">Day {index + 1}</span>
                    <div className="flex items-center space-x-3 flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#1B44FE] h-full rounded-full transition-all duration-500"
                          style={{ width: `${(count / Math.max(...reportData.dailyConsultations)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#0a0b10] w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Satisfaction */}
            <div className="bg-[#f8f9fa] rounded-[20px] p-6 border border-gray-100">
              <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-6">⭐ Patient Satisfaction Trend</h4>
              <div className="space-y-4">
                {reportData.patientSatisfaction.map((rating, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#7a7a7a] w-12">Day {index + 1}</span>
                    <div className="flex items-center space-x-3 flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(rating / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#0a0b10] w-8 text-right">{rating}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consultation Types Distribution */}
          <div className="mt-8 bg-[#f8f9fa] rounded-[20px] p-6 border border-gray-100">
            <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-6">📋 Consultation Types Distribution</h4>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {Object.entries(reportData.consultationTypes).map(([type, count]) => {
                  const total = Object.values(reportData.consultationTypes).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#7a7a7a] w-32 truncate">{type}</span>
                      <div className="flex items-center space-x-3 flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#0a0b10] w-16 text-right">{count} ({Math.round(Number(percentage))}%)</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center">
                <div className="bg-white rounded-[20px] p-8 border border-gray-100 text-center shadow-sm w-full max-w-xs">
                  <p className="text-[48px] font-bold text-[#0a0b10] leading-none mb-2">
                    {Object.values(reportData.consultationTypes).reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-[#7a7a7a] font-medium">Total Consultations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Generation */}
        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
          <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">📋 Generate Custom Reports</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-[#0a0b10] mb-2">Report Types</h4>
              <div className="space-y-3">
                <button
                  onClick={() => alert('📊 Weekly performance report generated!')}
                  className="w-full bg-[#f8f9fa] border border-gray-200 text-[#0a0b10] py-3 px-4 rounded-[12px] hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all text-left font-medium flex items-center gap-3"
                >
                  <span>📈</span> Weekly Performance Report
                </button>
                <button
                  onClick={() => alert('👥 Patient demographics report generated!')}
                  className="w-full bg-[#f8f9fa] border border-gray-200 text-[#0a0b10] py-3 px-4 rounded-[12px] hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all text-left font-medium flex items-center gap-3"
                >
                  <span>👥</span> Patient Demographics Report
                </button>
                <button
                  onClick={() => alert('⏰ Time management report generated!')}
                  className="w-full bg-[#f8f9fa] border border-gray-200 text-[#0a0b10] py-3 px-4 rounded-[12px] hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all text-left font-medium flex items-center gap-3"
                >
                  <span>⏰</span> Time Management Report
                </button>
                <button
                  onClick={() => alert('🎯 Treatment outcomes report generated!')}
                  className="w-full bg-[#f8f9fa] border border-gray-200 text-[#0a0b10] py-3 px-4 rounded-[12px] hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all text-left font-medium flex items-center gap-3"
                >
                  <span>🎯</span> Treatment Outcomes Report
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-[#0a0b10] mb-2">Quick Stats</h4>
              <div className="bg-[#f8f9fa] rounded-[16px] p-6 space-y-4 border border-gray-100">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-[#7a7a7a]">Total Patients</span>
                  <strong className="text-[#0a0b10] text-lg">{patients.length}</strong>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-[#7a7a7a]">Active Patients</span>
                  <strong className="text-[#0a0b10] text-lg">{patients.filter(p => p.status === 'active').length}</strong>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-[#7a7a7a]">Pending Reviews</span>
                  <strong className="text-[#0a0b10] text-lg">{pendingScans.filter(s => s.status === 'pending_review').length}</strong>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-[#7a7a7a]">This Week's Consultations</span>
                  <strong className="text-[#0a0b10] text-lg">{totalConsultations}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7a7a7a]">Average Rating</span>
                  <strong className="text-[#0a0b10] text-lg">{avgSatisfaction}/5.0 ⭐</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-8">
      {/* Profile Settings */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">Profile Settings</h3>
        <div className="flex items-start gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-5xl border-4 border-white shadow-lg">
              👨‍⚕️
            </div>
            <button className="text-sm font-medium text-[#1B44FE] hover:text-blue-700 transition-colors">
              Change Photo
            </button>
          </div>

          <div className="flex-1 grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0a0b10] mb-2">Full Name</label>
              <input
                type="text"
                defaultValue={user.name}
                className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent outline-none text-sm bg-[#f8f9fa]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0a0b10] mb-2">Email Address</label>
              <input
                type="email"
                defaultValue={user.email}
                className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent outline-none text-sm bg-[#f8f9fa]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0a0b10] mb-2">Specialization</label>
              <input
                type="text"
                defaultValue="Radiologist"
                className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent outline-none text-sm bg-[#f8f9fa]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0a0b10] mb-2">License Number</label>
              <input
                type="text"
                defaultValue="MD-12345-NY"
                className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent outline-none text-sm bg-[#f8f9fa]"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => alert('Profile updated successfully!')}
            className="px-6 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
            style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-[16px] border border-gray-100">
            <div>
              <h4 className="font-semibold text-[#0a0b10] text-[16px]">Email Notifications</h4>
              <p className="text-sm text-[#7a7a7a]">Receive daily summaries and urgent alerts via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={doctorSettings.emailNotifications}
                onChange={() => setDoctorSettings({ ...doctorSettings, emailNotifications: !doctorSettings.emailNotifications })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B44FE]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-[16px] border border-gray-100">
            <div>
              <h4 className="font-semibold text-[#0a0b10] text-[16px]">SMS Alerts</h4>
              <p className="text-sm text-[#7a7a7a]">Get text messages for urgent patient updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={doctorSettings.smsAlerts}
                onChange={() => setDoctorSettings({ ...doctorSettings, smsAlerts: !doctorSettings.smsAlerts })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B44FE]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">System Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-[16px] border border-gray-100">
            <div>
              <h4 className="font-semibold text-[#0a0b10] text-[16px]">Dark Mode</h4>
              <p className="text-sm text-[#7a7a7a]">Switch between light and dark themes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={doctorSettings.darkMode}
                onChange={() => setDoctorSettings({ ...doctorSettings, darkMode: !doctorSettings.darkMode })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B44FE]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-[16px] border border-gray-100">
            <div>
              <h4 className="font-semibold text-[#0a0b10] text-[16px]">Auto-Save Notes</h4>
              <p className="text-sm text-[#7a7a7a]">Automatically save clinical notes while typing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={doctorSettings.autoSave}
                onChange={() => setDoctorSettings({ ...doctorSettings, autoSave: !doctorSettings.autoSave })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B44FE]"></div>
            </label>
          </div>
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

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-Inter">
      {/* Header */}
      <header className="bg-white shadow-[0_4px_20px_0_rgba(0,0,0,0.02)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="flex w-[32px] h-[32px] items-center justify-center shrink-0 flex-nowrap relative rounded-[8px]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="h-5 w-5 fill-white"
                >
                  <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
                </svg>
              </div>
              <Link to="/" className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px]">
                Scanlytics
              </Link>
              <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
              <h1 className="text-[16px] font-medium text-[#7a7a7a]">Doctor Portal</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shadow-sm bg-green-500">
                  Dr
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0a0b10] leading-tight">{user.name}</span>
                  <span className="text-xs text-[#7a7a7a]">Doctor</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#7a7a7a] hover:text-[#FF4D4D] text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 overflow-x-auto">
          <nav className="flex space-x-2 p-1 bg-white rounded-[16px] shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'reviews', label: 'AI Reviews', icon: '🤖' },
              { id: 'patients', label: 'Patient Management', icon: '👥' },
              { id: 'reports', label: 'Reports', icon: '📋' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-5 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                  ? 'text-white shadow-md'
                  : 'text-[#7a7a7a] hover:bg-gray-50 hover:text-[#0a0b10]'
                  }`}
                style={activeTab === tab.id ? { background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' } : {}}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'reviews' && renderAIReviews()}
          {activeTab === 'patients' && renderPatientManagement()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
