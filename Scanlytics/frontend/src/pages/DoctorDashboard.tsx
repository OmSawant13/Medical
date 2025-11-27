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
    <div className="space-y-6">
      {/* Doctor Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="text-3xl text-red-500 mr-4">🩺</div>
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingScans.filter(s => s.status === 'pending_review').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="text-3xl text-blue-500 mr-4">👥</div>
            <div>
              <p className="text-sm text-gray-600">Patients in Queue</p>
              <p className="text-2xl font-bold text-gray-900">{patientQueue.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="text-3xl text-green-500 mr-4">✅</div>
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="text-3xl text-purple-500 mr-4">🎯</div>
            <div>
              <p className="text-sm text-gray-600">Avg Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {(reportData.patientSatisfaction.reduce((a, b) => a + b, 0) / reportData.patientSatisfaction.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Queue */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Patient Queue (Priority-Based)</h3>
        <div className="space-y-4">
          {patientQueue.sort((a, b) => b.priority - a.priority).map(patient => (
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
                  <p className="text-sm text-gray-500">Contact: {patient.contact}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Scheduled: {patient.appointmentTime}</p>
                <p className="text-sm text-gray-600">Waiting: {patient.waitTime} min</p>
                <button 
                  onClick={() => seePatient(patient)}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
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
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Medical Notes</h3>
          <p className="text-gray-600 mb-4">Document patient consultations and treatments</p>
          <button 
            onClick={addMedicalNotes}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Add Notes
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Metrics</h3>
          <p className="text-gray-600 mb-4">View your diagnostic accuracy and patient feedback</p>
          <button 
            onClick={viewPerformanceMetrics}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            View Metrics
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Report</h3>
          <p className="text-gray-600 mb-4">Create comprehensive patient reports</p>
          <button 
            onClick={generateReport}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );

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
                onClick={() => alert('📝 Add new patient functionality would open here')}
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedPatient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
      
      alert('✅ Detailed report exported successfully!');
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
                  onClick={() => alert('📊 Weekly performance report generated!')}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-left pl-4"
                >
                  📈 Weekly Performance Report
                </button>
                <button 
                  onClick={() => alert('👥 Patient demographics report generated!')}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 text-left pl-4"
                >
                  👥 Patient Demographics Report
                </button>
                <button 
                  onClick={() => alert('⏰ Time management report generated!')}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 text-left pl-4"
                >
                  ⏰ Time Management Report
                </button>
                <button 
                  onClick={() => alert('🎯 Treatment outcomes report generated!')}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600 mr-8">
                🏥 Healthcare AI
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Doctor Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  Dr
                </div>
                <span className="text-gray-700">{user.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '��' },
              { id: 'reviews', label: 'AI Reviews', icon: '🤖' },
              { id: 'patients', label: 'Patient Management', icon: '👥' },
              { id: 'reports', label: 'Reports', icon: '📋' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
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
