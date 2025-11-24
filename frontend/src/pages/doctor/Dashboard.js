import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI, longTermPatientsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import QRScanner from '../../components/QRScanner';

const DoctorDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [longTermStats, setLongTermStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchLongTermStats();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await doctorAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchLongTermStats = async () => {
    try {
      const response = await longTermPatientsAPI.getAll();
      setLongTermStats(response.data);
    } catch (error) {
      console.error('Failed to load long-term stats');
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, status);
      toast.success('Appointment status updated');
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleQRScanSuccess = (data) => {
    if (data.patient?.user_id) {
      navigate(`/doctor/patient/${data.patient.user_id}`);
    }
    setShowQRScanner(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!dashboard) return <div>No data available</div>;

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Doctor Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/doctor/long-term-patients" className="btn btn-warning" style={{ textDecoration: 'none' }}>
            👥 Long-Term Patients {longTermStats?.dueForCheck > 0 && `(${longTermStats.dueForCheck})`}
          </Link>
          <button className="btn btn-primary" onClick={() => setShowQRScanner(!showQRScanner)}>
            {showQRScanner ? 'Hide QR Scanner' : '📱 Scan QR Code'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {longTermStats && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{dashboard?.todayAppointments?.length || 0}</div>
            <div className="stat-label">Today's Appointments</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{dashboard?.pendingRequests?.length || 0}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{longTermStats.active || 0}</div>
            <div className="stat-label">Long-Term Patients</div>
          </div>
          {longTermStats.dueForCheck > 0 && (
            <div className="stat-card danger">
              <div className="stat-icon">⚠️</div>
              <div className="stat-value">{longTermStats.dueForCheck}</div>
              <div className="stat-label">Due for Check Today</div>
            </div>
          )}
        </div>
      )}

      {showQRScanner && (
        <QRScanner onScanSuccess={handleQRScanSuccess} />
      )}

      {/* Due for Check Alert */}
      {longTermStats?.dueForCheck > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)', borderLeft: '4px solid var(--warning)' }}>
          <div className="flex-between">
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>⚠️ {longTermStats.dueForCheck} Long-Term Patient(s) Due for Check Today</h3>
              <p style={{ margin: 0, color: 'var(--gray-700)' }}>
                These patients need your daily check-in. Click below to manage them.
              </p>
            </div>
            <Link to="/doctor/long-term-patients" className="btn btn-warning" style={{ textDecoration: 'none' }}>
              View Long-Term Patients →
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Today's Appointments</h2>
        {dashboard.todayAppointments.length === 0 ? (
          <p>No appointments today</p>
        ) : (
          <div>
            {dashboard.todayAppointments.map((apt) => (
              <div key={apt.appointment_id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                <p><strong>Patient:</strong> {apt.patient_id?.name} ({apt.patient_id?.user_id})</p>
                <p><strong>Time:</strong> {format(new Date(apt.date_time), 'pp')}</p>
                <p><strong>Symptoms:</strong> {apt.symptoms}</p>
                {apt.patient_id?.allergies && apt.patient_id.allergies.length > 0 && (
                  <p><strong>Allergies:</strong> {apt.patient_id.allergies.join(', ')}</p>
                )}
                <div style={{ marginTop: '10px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/doctor/patient/${apt.patient_id?.user_id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                    View Patient
                  </Link>
                  <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(apt.appointment_id, 'accepted')}>
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Pending Requests</h2>
        {dashboard.pendingRequests.length === 0 ? (
          <p>No pending requests</p>
        ) : (
          <div>
            {dashboard.pendingRequests.map((apt) => (
              <div key={apt.appointment_id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                <p><strong>Patient:</strong> {apt.patient_id?.name}</p>
                <p><strong>Date:</strong> {format(new Date(apt.date_time), 'PPpp')}</p>
                <p><strong>Symptoms:</strong> {apt.symptoms}</p>
                <div style={{ marginTop: '10px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/doctor/patient/${apt.patient_id?.user_id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                    View Patient
                  </Link>
                  <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(apt.appointment_id, 'accepted')}>
                    Accept
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(apt.appointment_id, 'cancelled')}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Past Patients (Last 30 Days)</h2>
        {dashboard.pastPatients.length === 0 ? (
          <p>No past patients</p>
        ) : (
          <div>
            {dashboard.pastPatients.map((apt) => (
              <div key={apt.appointment_id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                <Link to={`/doctor/patient/${apt.patient_id?.user_id}`}>
                  {apt.patient_id?.name} - {format(new Date(apt.date_time), 'PP')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;

