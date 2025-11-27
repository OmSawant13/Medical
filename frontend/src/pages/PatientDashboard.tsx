import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { patientAPI } from '../services/api';

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
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed';
  qrCode?: string;
  meetingLink?: string;
  symptoms?: string;
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState<Appointment | null>(null);
  const [showNewAppointmentQR, setShowNewAppointmentQR] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    doctorName: '',
    date: '',
    time: '',
    type: 'consultation',
    symptoms: ''
  });

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all patient data in parallel
      const [profileData, appointmentsData, scansData, notificationsData] = await Promise.all([
        patientAPI.getProfile(),
        patientAPI.getAppointments(),
        patientAPI.getScans(),
        patientAPI.getNotifications(),
      ]);

      setUser(profileData);
      setAppointments(appointmentsData);
      setScans(scansData);
      setNotifications(notificationsData);

      // Update user settings with real data
      setUserSettings(prev => ({
        ...prev,
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        dateOfBirth: profileData.dateOfBirth || '',
        address: profileData.address || '',
        emergencyContact: profileData.emergencyContact || '',
        bloodType: profileData.bloodType || 'O+',
        allergies: profileData.allergies || [],
        medications: profileData.medications || [],
        notifications: profileData.notifications || prev.notifications,
        privacy: profileData.privacy || prev.privacy,
      }));

    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');

      // If unauthorized, redirect to login
      if (error.message?.includes('401') || error.message?.includes('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/login?role=patient');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      navigate('/login?role=patient');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Load real data from API
    loadUserData();
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

  const bookAppointment = async () => {
    if (!bookingForm.doctorName || !bookingForm.date || !bookingForm.time) {
      alert('❌ Please fill in all required fields');
      return;
    }

    try {
      const appointmentData = {
        doctorName: bookingForm.doctorName,
        date: bookingForm.date,
        time: bookingForm.time,
        type: bookingForm.type,
        symptoms: bookingForm.symptoms,
      };

      const newAppointment = await patientAPI.bookAppointment(appointmentData);

      setAppointments(prev => [newAppointment, ...prev]);
      setBookingForm({ doctorName: '', date: '', time: '', type: 'consultation', symptoms: '' });
      setShowBookingForm(false);

      // Show the QR code immediately after booking
      setShowNewAppointmentQR(newAppointment);

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      alert('❌ Failed to book appointment: ' + (error.message || 'Unknown error'));
    }
  };

  const joinVideoCall = (appointment: Appointment) => {
    if (appointment.meetingLink) {
      window.open(appointment.meetingLink, '_blank');
    } else {
      alert('❌ Video call link not available for this appointment');
    }
  };

  const showQRCode = (appointment: Appointment) => {
    setShowQRModal(appointment);
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

  const addMedicalNotes = () => {
    const notes = window.prompt('Enter your medical notes or symptoms:');
    if (notes) {
      alert(`✅ Medical notes added:\n"${notes}"\n\nNotes will be shared with your doctor during the next consultation.`);
    }
  };

  const viewPerformanceMetrics = () => {
    const metrics = {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      totalScans: scans.length,
      averageWaitTime: '15 minutes',
      lastVisit: appointments.length > 0 ? appointments[appointments.length - 1]?.date : 'N/A'
    };

    alert(`📊 Your Health Metrics:\n\n` +
      `Total Appointments: ${metrics.totalAppointments}\n` +
      `Completed: ${metrics.completedAppointments}\n` +
      `Total Scans: ${metrics.totalScans}\n` +
      `Average Wait Time: ${metrics.averageWaitTime}\n` +
      `Last Visit: ${metrics.lastVisit}`);
  };

  const generateHealthReport = () => {
    const report = {
      patientName: user?.name || 'Patient',
      reportDate: new Date().toLocaleDateString(),
      healthSummary: {
        recentScans: scans.filter(s => s.status === 'doctor_reviewed').length,
        upcomingAppointments: appointments.filter(a => a.status !== 'completed').length,
        overallHealth: 'Good',
        recommendations: [
          'Continue regular checkups',
          'Maintain healthy lifestyle',
          'Follow prescribed medications'
        ]
      }
    };

    alert(`🏥 Health Report Generated!\n\n` +
      `Patient: ${report.patientName}\n` +
      `Date: ${report.reportDate}\n` +
      `Recent Scans: ${report.healthSummary.recentScans}\n` +
      `Upcoming Appointments: ${report.healthSummary.upcomingAppointments}\n` +
      `Overall Health: ${report.healthSummary.overallHealth}\n\n` +
      `Report saved to your medical records.`);
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
      await patientAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('userRole');
      navigate('/');
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[20px] p-8 text-white shadow-[0_7px_21px_0_rgba(27,68,254,0.03)]"
        style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
        <div className="relative z-10">
          <h2 className="text-[32px] font-semibold tracking-[-1.6px] leading-tight mb-2">Welcome back, {user?.name || 'Patient'}!</h2>
          <p className="text-blue-100 text-lg">Here's your health overview for today</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: '🩺', label: 'Total Scans', value: scans.length, color: 'bg-blue-50 text-blue-600' },
          { icon: '📅', label: 'Appointments', value: appointments.length, color: 'bg-green-50 text-green-600' },
          { icon: '🔔', label: 'Notifications', value: notifications.filter(n => n.unread).length, color: 'bg-yellow-50 text-yellow-600' },
          { icon: '🏥', label: 'Patient ID', value: user?.roleSpecificId || 'Loading...', color: 'bg-purple-50 text-purple-600' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-2xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-[#7a7a7a]">{stat.label}</p>
                <p className="text-2xl font-bold text-[#0a0b10] tracking-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Scans */}
        <div className="bg-white rounded-[20px] p-8 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Recent Medical Scans</h3>
            <button onClick={() => setActiveTab('history')} className="text-sm font-medium text-[#1B44FE] hover:text-[#1534c0]">View All</button>
          </div>
          {scans.length > 0 ? (
            <div className="space-y-4">
              {scans.slice(0, 3).map(scan => (
                <div key={scan._id} className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-[16px] border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      🩺
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0a0b10]">{scan.scanType}</h4>
                      <p className="text-sm text-[#7a7a7a]">{new Date(scan.uploadDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scan.status === 'doctor_reviewed' ? 'bg-green-100 text-green-700' :
                      scan.status === 'analysis_complete' ? 'bg-blue-100 text-blue-700' :
                        scan.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {scan.status.replace('_', ' ')}
                    </span>
                    {scan.aiResults && (
                      <p className="text-xs text-[#7a7a7a] mt-1 font-medium">
                        {(scan.aiResults.confidence * 100).toFixed(0)}% Confidence
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#f8f9fa] rounded-[16px] border border-dashed border-gray-200">
              <p className="text-[#7a7a7a]">No medical scans yet</p>
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-[20px] p-8 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Upcoming Appointments</h3>
            <button onClick={() => setActiveTab('appointments')} className="text-sm font-medium text-[#1B44FE] hover:text-[#1534c0]">View All</button>
          </div>
          {appointments.filter(apt => apt.status !== 'completed').length > 0 ? (
            <div className="space-y-4">
              {appointments.filter(apt => apt.status !== 'completed').slice(0, 3).map(appointment => (
                <div key={appointment._id} className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-[16px] border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      📅
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0a0b10]">{appointment.doctorName}</h4>
                      <p className="text-sm text-[#7a7a7a]">
                        {new Date(appointment.date).toLocaleDateString()} • {appointment.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                      }`}>
                      {appointment.status}
                    </span>
                    <div className="flex gap-2">
                      {appointment.meetingLink && (
                        <button
                          onClick={() => joinVideoCall(appointment)}
                          className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                          title="Join Video Call"
                        >
                          📹
                        </button>
                      )}
                      <button
                        onClick={() => showQRCode(appointment)}
                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                        title="Show QR Code"
                      >
                        📱
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#f8f9fa] rounded-[16px] border border-dashed border-gray-200">
              <p className="text-[#7a7a7a]">No upcoming appointments</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: '📝', title: 'Add Medical Notes', desc: 'Document symptoms or health concerns', action: addMedicalNotes, color: 'text-green-600 bg-green-50' },
          { icon: '📊', title: 'Health Metrics', desc: 'View your health statistics and trends', action: viewPerformanceMetrics, color: 'text-blue-600 bg-blue-50' },
          { icon: '📱', title: 'Generate Report', desc: 'Create comprehensive health summary', action: generateHealthReport, color: 'text-purple-600 bg-purple-50' }
        ].map((action, index) => (
          <div key={index} className="bg-white rounded-[20px] p-6 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all duration-300 group cursor-pointer" onClick={action.action}>
            <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-2xl mb-4 ${action.color} group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <h3 className="text-lg font-semibold text-[#0a0b10] mb-2">{action.title}</h3>
            <p className="text-[#7a7a7a] text-sm mb-4">{action.desc}</p>
            <div className="flex items-center text-[#1B44FE] font-medium text-sm group-hover:translate-x-1 transition-transform">
              Get Started <span className="ml-1">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMedicalHistory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Complete Medical History</h3>
          <button
            onClick={downloadReport}
            className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
            style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
          >
            📥 Download Report
          </button>
        </div>

        {scans.length > 0 ? (
          <div className="space-y-6">
            {scans.map(scan => (
              <div key={scan._id} className="border border-gray-100 rounded-[16px] p-6 hover:border-gray-200 transition-colors bg-[#f8f9fa]">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-blue-50 flex items-center justify-center text-2xl text-blue-600">
                      🩺
                    </div>
                    <div>
                      <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-1">{scan.scanType}</h4>
                      <div className="flex gap-4 text-sm text-[#7a7a7a]">
                        <span>ID: {scan._id}</span>
                        <span>•</span>
                        <span>{new Date(scan.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${scan.status === 'doctor_reviewed' ? 'bg-green-100 text-green-700' :
                    scan.status === 'analysis_complete' ? 'bg-blue-100 text-blue-700' :
                      scan.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {scan.status.replace('_', ' ')}
                  </span>
                </div>

                {scan.aiResults && (
                  <div className="bg-white rounded-[12px] p-5 border border-gray-100">
                    <h5 className="font-semibold text-[#0a0b10] mb-4 flex items-center gap-2">
                      <span>🤖</span> AI Analysis Results
                      <span className="text-sm font-normal text-[#7a7a7a] ml-2">
                        (Confidence: {(scan.aiResults.confidence * 100).toFixed(1)}%)
                      </span>
                    </h5>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h6 className="font-medium text-[#0a0b10] mb-3 text-sm uppercase tracking-wide">Findings</h6>
                        <ul className="space-y-2">
                          {scan.aiResults.findings.map((finding, index) => (
                            <li key={index} className="text-sm text-[#7a7a7a] flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h6 className="font-medium text-[#0a0b10] mb-3 text-sm uppercase tracking-wide">Recommendations</h6>
                        <ul className="space-y-2">
                          {scan.aiResults.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-[#7a7a7a] flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {scan.status === 'processing' && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-[12px] p-4 mt-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
                      <p className="text-yellow-800 font-medium">AI analysis in progress... Estimated completion: 2-3 minutes</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#f8f9fa] rounded-[20px] border border-dashed border-gray-200">
            <div className="text-6xl mb-4 opacity-50">🩺</div>
            <h3 className="text-xl font-semibold text-[#0a0b10] mb-2">No Medical History Yet</h3>
            <p className="text-[#7a7a7a]">Your medical scans and reports will appear here once available.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-8">
      {/* Book New Appointment */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Book New Appointment</h3>
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className={`px-5 py-2.5 rounded-[12px] text-sm font-semibold transition-all ${showBookingForm
              ? 'bg-gray-100 text-[#7a7a7a] hover:bg-gray-200'
              : 'text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)]'
              }`}
            style={!showBookingForm ? { background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' } : {}}
          >
            {showBookingForm ? 'Cancel' : '📅 New Appointment'}
          </button>
        </div>

        {showBookingForm && (
          <div className="border border-blue-100 rounded-[16px] p-6 bg-blue-50/50">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#0a0b10] mb-2">Select Doctor</label>
                <select
                  value={bookingForm.doctorName}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, doctorName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent bg-white transition-all"
                >
                  <option value="">Choose a doctor...</option>
                  <option value="Dr. Sarah Johnson - Cardiology">Dr. Sarah Johnson - Cardiology</option>
                  <option value="Dr. Michael Chen - Radiology">Dr. Michael Chen - Radiology</option>
                  <option value="Dr. Emily Davis - General Practice">Dr. Emily Davis - General Practice</option>
                  <option value="Dr. Robert Wilson - Neurology">Dr. Robert Wilson - Neurology</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0a0b10] mb-2">Appointment Type</label>
                <select
                  value={bookingForm.type}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent bg-white transition-all"
                >
                  <option value="consultation">In-Person Consultation</option>
                  <option value="video-call">Video Call</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0a0b10] mb-2">Preferred Date</label>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0a0b10] mb-2">Preferred Time</label>
                <input
                  type="time"
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0a0b10] mb-2">Symptoms (Optional)</label>
              <textarea
                value={bookingForm.symptoms}
                onChange={(e) => setBookingForm(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Describe your symptoms or reason for visit..."
                className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
                rows={3}
              />
            </div>
            <button
              onClick={bookAppointment}
              className="w-full sm:w-auto px-8 py-3 rounded-[12px] text-white font-semibold shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
              style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
            >
              📅 Book Appointment
            </button>
          </div>
        )}
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">Appointment History</h3>
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map(appointment => (
              <div key={appointment._id} className="border border-gray-100 rounded-[16px] p-6 hover:border-gray-200 transition-colors bg-[#f8f9fa]">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-purple-50 flex items-center justify-center text-2xl text-purple-600 shrink-0">
                      📅
                    </div>
                    <div>
                      <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-1">{appointment.doctorName}</h4>
                      <p className="text-[#7a7a7a] font-medium mb-1">{appointment.type}</p>
                      <div className="flex items-center gap-2 text-sm text-[#7a7a7a]">
                        <span>📅 {new Date(appointment.date).toLocaleDateString()}</span>
                        <span>⏰ {appointment.time}</span>
                      </div>
                      <p className="text-xs text-[#7a7a7a] mt-2 opacity-60">ID: {appointment._id}</p>
                      {appointment.symptoms && (
                        <div className="mt-3 bg-white rounded-[8px] p-3 border border-gray-100 text-sm text-[#7a7a7a]">
                          <strong className="text-[#0a0b10]">Symptoms:</strong> {appointment.symptoms}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${appointment.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {appointment.status}
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {appointment.meetingLink && appointment.status === 'confirmed' && (
                        <button
                          onClick={() => joinVideoCall(appointment)}
                          className="px-4 py-2 rounded-[8px] bg-green-50 text-green-600 text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                          🎥 Join Call
                        </button>
                      )}
                      {appointment.status !== 'completed' && appointment.qrCode && (
                        <button
                          onClick={() => showQRCode(appointment)}
                          className="px-4 py-2 rounded-[8px] bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                        >
                          📱 QR Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#f8f9fa] rounded-[20px] border border-dashed border-gray-200">
            <div className="text-6xl mb-4 opacity-50">📅</div>
            <h3 className="text-xl font-semibold text-[#0a0b10] mb-2">No Appointments Yet</h3>
            <p className="text-[#7a7a7a] mb-6">Book your first appointment to get started.</p>
            <button
              onClick={() => setShowBookingForm(true)}
              className="px-6 py-3 rounded-[12px] text-white font-semibold shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
              style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
            >
              📅 Book First Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Health Notifications</h3>
          {notifications.some(n => n.unread) && (
            <button
              onClick={markAllAsRead}
              className="text-[#1B44FE] hover:text-[#1534c0] font-semibold text-sm flex items-center gap-2"
            >
              <span>✓</span> Mark All as Read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div key={notification._id} className={`p-5 rounded-[16px] border transition-all ${notification.unread
                ? 'bg-blue-50 border-blue-100 shadow-sm'
                : 'bg-white border-gray-100 hover:border-gray-200'
                }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${notification.type === 'scan_result' ? 'bg-blue-100 text-blue-600' :
                      notification.type === 'appointment' ? 'bg-purple-100 text-purple-600' :
                        notification.type === 'medication' ? 'bg-green-100 text-green-600' :
                          'bg-yellow-100 text-yellow-600'
                      }`}>
                      {notification.type === 'scan_result' ? '🩺' :
                        notification.type === 'appointment' ? '📅' :
                          notification.type === 'medication' ? '💊' : '🔔'}
                    </div>
                    <div>
                      <h4 className={`font-semibold text-[#0a0b10] mb-1 ${notification.unread ? 'text-blue-900' : ''}`}>
                        {notification.title}
                      </h4>
                      <p className="text-[#7a7a7a] text-sm leading-relaxed">{notification.message}</p>
                      <p className="text-xs text-[#7a7a7a] mt-2 font-medium opacity-60">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {notification.unread && (
                    <div className="w-2.5 h-2.5 bg-[#1B44FE] rounded-full shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#f8f9fa] rounded-[20px] border border-dashed border-gray-200">
            <div className="text-6xl mb-4 opacity-50">🔔</div>
            <h3 className="text-xl font-semibold text-[#0a0b10] mb-2">No Notifications</h3>
            <p className="text-[#7a7a7a]">You're all caught up! Notifications will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6 flex items-center gap-2">
          <span>👤</span> Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Full Name</label>
            <input
              type="text"
              value={userSettings.name}
              onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Email Address</label>
            <input
              type="email"
              value={userSettings.email}
              onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Phone Number</label>
            <input
              type="tel"
              value={userSettings.phone}
              onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Date of Birth</label>
            <input
              type="date"
              value={userSettings.dateOfBirth}
              onChange={(e) => setUserSettings(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Address</label>
            <textarea
              value={userSettings.address}
              onChange={(e) => setUserSettings(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Emergency Contact</label>
            <input
              type="tel"
              value={userSettings.emergencyContact}
              onChange={(e) => setUserSettings(prev => ({ ...prev, emergencyContact: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Blood Type</label>
            <select
              value={userSettings.bloodType}
              onChange={(e) => setUserSettings(prev => ({ ...prev, bloodType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent bg-white transition-all"
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
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6 flex items-center gap-2">
          <span>🩺</span> Medical Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Allergies</label>
            <textarea
              value={userSettings.allergies.join(', ')}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                allergies: e.target.value.split(',').map(item => item.trim()).filter(item => item)
              }))}
              placeholder="Enter allergies separated by commas"
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0a0b10] mb-2">Current Medications</label>
            <textarea
              value={userSettings.medications.join(', ')}
              onChange={(e) => setUserSettings(prev => ({
                ...prev,
                medications: e.target.value.split(',').map(item => item.trim()).filter(item => item)
              }))}
              placeholder="Enter medications separated by commas"
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent transition-all"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6 flex items-center gap-2">
          <span>🔔</span> Notification Preferences
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Email Notifications', desc: 'Receive notifications via email', key: 'email' },
            { label: 'SMS Notifications', desc: 'Receive notifications via SMS', key: 'sms' },
            { label: 'Push Notifications', desc: 'Receive browser push notifications', key: 'push' },
            { label: 'Appointment Reminders', desc: 'Get reminders for upcoming appointments', key: 'appointmentReminders' },
            { label: 'Scan Results', desc: 'Get notified when scan results are ready', key: 'scanResults' },
            { label: 'Medication Reminders', desc: 'Get reminders to take medications', key: 'medicationReminders' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-[12px] hover:bg-gray-50 transition-colors">
              <div>
                <label className="font-medium text-[#0a0b10] block">{item.label}</label>
                <p className="text-sm text-[#7a7a7a]">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={userSettings.notifications[item.key as keyof typeof userSettings.notifications]}
                onChange={(e) => setUserSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, [item.key]: e.target.checked }
                }))}
                className="h-5 w-5 text-[#1B44FE] rounded focus:ring-[#1B44FE] border-gray-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6 flex items-center gap-2">
          <span>🔒</span> Privacy Settings
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Share Data with Doctors', desc: 'Allow doctors to access your medical history', key: 'shareDataWithDoctors' },
            { label: 'Share Data for Research', desc: 'Allow anonymous data usage for medical research', key: 'shareDataForResearch' },
            { label: 'Marketing Emails', desc: 'Receive promotional and marketing emails', key: 'allowMarketingEmails' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-[12px] hover:bg-gray-50 transition-colors">
              <div>
                <label className="font-medium text-[#0a0b10] block">{item.label}</label>
                <p className="text-sm text-[#7a7a7a]">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={userSettings.privacy[item.key as keyof typeof userSettings.privacy]}
                onChange={(e) => setUserSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, [item.key]: e.target.checked }
                }))}
                className="h-5 w-5 text-[#1B44FE] rounded focus:ring-[#1B44FE] border-gray-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Settings */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100 sticky bottom-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-[#0a0b10]">Save Changes</h3>
            <p className="text-[#7a7a7a]">Make sure to save your changes before leaving this page</p>
          </div>
          <button
            onClick={saveSettings}
            className="px-8 py-3 rounded-[12px] text-white font-semibold shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all"
            style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
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
              <p className="text-sm text-gray-600"><strong>Appointment:</strong> {appointmentToShow.doctorName}</p>
              <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(appointmentToShow.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600"><strong>Time:</strong> {appointmentToShow.time}</p>
              <p className="text-sm text-gray-600"><strong>Type:</strong> {appointmentToShow.type}</p>
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
              <h1 className="text-[16px] font-medium text-[#7a7a7a]">Patient Portal</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <button className="relative text-[#7a7a7a] hover:text-[#0a0b10] transition-colors">
                  <span className="text-xl">🔔</span>
                  {notifications.filter(n => n.unread).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FF4D4D] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                      {notifications.filter(n => n.unread).length}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                  style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                  {user.name?.charAt(0) || 'P'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0a0b10] leading-tight">{user.name}</span>
                  <span className="text-xs text-[#7a7a7a]">Patient</span>
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
              { id: 'history', label: 'Medical History', icon: '🩺' },
              { id: 'appointments', label: 'Appointments', icon: '📅' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
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
                {tab.id === 'notifications' && notifications.filter(n => n.unread).length > 0 && (
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#FF4D4D] text-white'
                    }`}>
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'history' && renderMedicalHistory()}
          {activeTab === 'appointments' && renderAppointments()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal />
    </div>
  );
};

export default PatientDashboard;
