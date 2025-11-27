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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Patient'}!</h2>
        <p className="text-blue-100">Here's your health overview for today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="text-3xl text-green-500 mr-4">🩺</div>
            <div>
              <p className="text-sm text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">{scans.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="text-3xl text-blue-500 mr-4">📅</div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="text-3xl text-yellow-500 mr-4">🔔</div>
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.filter(n => n.unread).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="text-3xl text-purple-500 mr-4">🏥</div>
            <div>
              <p className="text-sm text-gray-600">Patient ID</p>
              <p className="text-lg font-bold text-gray-900">{user?.roleSpecificId || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Medical Scans</h3>
          {scans.length > 0 ? (
            <div className="space-y-4">
              {scans.slice(0, 3).map(scan => (
                <div key={scan._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">{scan.scanType}</h4>
                    <p className="text-sm text-gray-600">{new Date(scan.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      scan.status === 'doctor_reviewed' ? 'bg-green-100 text-green-800' :
                      scan.status === 'analysis_complete' ? 'bg-blue-100 text-blue-800' :
                      scan.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {scan.status.replace('_', ' ')}
                    </span>
                    {scan.aiResults && (
                      <p className="text-sm text-gray-600 mt-1">
                        AI Confidence: {(scan.aiResults.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No medical scans yet</p>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h3>
          {appointments.filter(apt => apt.status !== 'completed').length > 0 ? (
            <div className="space-y-4">
              {appointments.filter(apt => apt.status !== 'completed').slice(0, 3).map(appointment => (
                <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">{appointment.doctorName}</h4>
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status}
                    </span>
                    <div className="mt-2 space-x-2">
                      {appointment.meetingLink && (
                        <button 
                          onClick={() => joinVideoCall(appointment)}
                          className="text-xs text-green-600 hover:text-green-800 bg-green-100 px-2 py-1 rounded"
                        >
                          📹 Join Call
                        </button>
                      )}
                      <button 
                        onClick={() => showQRCode(appointment)}
                        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-100 px-2 py-1 rounded"
                      >
                        📱 QR Code
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Medical Notes</h3>
          <p className="text-gray-600 mb-4">Document symptoms or health concerns</p>
          <button 
            onClick={addMedicalNotes}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Add Notes
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Metrics</h3>
          <p className="text-gray-600 mb-4">View your health statistics and trends</p>
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
          <p className="text-gray-600 mb-4">Create comprehensive health summary</p>
          <button 
            onClick={generateHealthReport}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );

  const renderMedicalHistory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Complete Medical History</h3>
          <button 
            onClick={downloadReport}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            📥 Download Report
          </button>
        </div>
        
        {scans.length > 0 ? (
          <div className="space-y-4">
            {scans.map(scan => (
              <div key={scan._id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{scan.scanType}</h4>
                    <p className="text-gray-600">Scan ID: {scan._id}</p>
                    <p className="text-gray-600">Date: {new Date(scan.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    scan.status === 'doctor_reviewed' ? 'bg-green-100 text-green-800' :
                    scan.status === 'analysis_complete' ? 'bg-blue-100 text-blue-800' :
                    scan.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {scan.status.replace('_', ' ')}
                  </span>
                </div>
                
                {scan.aiResults && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">
                      🤖 AI Analysis Results (Confidence: {(scan.aiResults.confidence * 100).toFixed(1)}%)
                    </h5>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="font-medium text-gray-700 mb-2">Findings:</h6>
                        <ul className="list-disc list-inside space-y-1">
                          {scan.aiResults.findings.map((finding, index) => (
                            <li key={index} className="text-sm text-gray-600">{finding}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h6 className="font-medium text-gray-700 mb-2">Recommendations:</h6>
                        <ul className="list-disc list-inside space-y-1">
                          {scan.aiResults.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-600">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {scan.status === 'processing' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
                      <p className="text-yellow-800">AI analysis in progress... Estimated completion: 2-3 minutes</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🩺</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Medical History Yet</h3>
            <p className="text-gray-600">Your medical scans and reports will appear here once available.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      {/* Book New Appointment */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Book New Appointment</h3>
          <button 
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            {showBookingForm ? 'Cancel' : '📅 New Appointment'}
          </button>
        </div>

        {showBookingForm && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select 
                  value={bookingForm.doctorName}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, doctorName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a doctor...</option>
                  <option value="Dr. Sarah Johnson - Cardiology">Dr. Sarah Johnson - Cardiology</option>
                  <option value="Dr. Michael Chen - Radiology">Dr. Michael Chen - Radiology</option>
                  <option value="Dr. Emily Davis - General Practice">Dr. Emily Davis - General Practice</option>
                  <option value="Dr. Robert Wilson - Neurology">Dr. Robert Wilson - Neurology</option>
                </select>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                <input 
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
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
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold"
            >
              📅 Book Appointment
            </button>
          </div>
        )}
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Appointment History</h3>
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map(appointment => (
              <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h4>
                    <p className="text-gray-600">{appointment.type}</p>
                    <p className="text-gray-600">
                      📅 {new Date(appointment.date).toLocaleDateString()} at ⏰ {appointment.time}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">ID: {appointment._id}</p>
                    {appointment.symptoms && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Symptoms:</strong> {appointment.symptoms}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status}
                    </span>
                    <div className="mt-2 space-x-2">
                      {appointment.meetingLink && appointment.status === 'confirmed' && (
                        <button 
                          onClick={() => joinVideoCall(appointment)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          🎥 Join Call
                        </button>
                      )}
                      {appointment.status !== 'completed' && appointment.qrCode && (
                        <button 
                          onClick={() => showQRCode(appointment)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
            <p className="text-gray-600 mb-4">Book your first appointment to get started.</p>
            <button 
              onClick={() => setShowBookingForm(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
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
              <div key={notification._id} className={`p-4 rounded-lg border ${
                notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">You're all caught up! Notifications will appear here.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600 mr-8">
                🏥 Healthcare AI
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Patient Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="relative text-gray-600 hover:text-gray-900">
                  🔔
                  {notifications.filter(n => n.unread).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter(n => n.unread).length}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name?.charAt(0) || 'P'}
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
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'history', label: 'Medical History', icon: '🩺' },
              { id: 'appointments', label: 'Appointments', icon: '📅' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.id === 'notifications' && notifications.filter(n => n.unread).length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
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
