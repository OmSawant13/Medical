import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const PatientDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await patientAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Unable to load dashboard</div>
        <div className="empty-state-description">Please try refreshing the page</div>
      </div>
    );
  }

  const upcomingCount = dashboard.upcomingAppointments?.length || 0;
  const recordsCount = dashboard.recentRecords?.length || 0;
  const pastCount = dashboard.pastAppointments?.length || 0;

  return (
    <div className="container">
      {/* Welcome Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
        <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>
          Welcome back, {dashboard.patient.name}! 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', margin: 0 }}>
          Here's your health overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{upcomingCount}</div>
          <div className="stat-label">Upcoming Appointments</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{recordsCount}</div>
          <div className="stat-label">Medical Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{pastCount}</div>
          <div className="stat-label">Past Visits</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="grid grid-3">
          <Link to="/patient/appointments" className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <span>📅</span>
            <span>Book Appointment</span>
          </Link>
          <Link to="/patient/history" className="btn btn-outline" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <span>🏥</span>
            <span>Health Locker</span>
          </Link>
          <Link to="/patient/nearby-hospitals" className="btn btn-outline" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <span>📍</span>
            <span>Find Hospitals & Doctors</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Upcoming Appointments</h2>
          <Link to="/patient/appointments" className="btn btn-sm btn-outline">
            View All
          </Link>
        </div>
        {upcomingCount === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No upcoming appointments</div>
            <div className="empty-state-description">Book your first appointment to get started</div>
            <Link to="/patient/appointments" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
              Book Appointment
            </Link>
          </div>
        ) : (
          <div className="grid grid-2">
            {dashboard.upcomingAppointments.slice(0, 2).map((apt) => (
              <div key={apt.appointment_id} className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--primary)' }}>
                <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0 }}>{apt.doctor_id?.name || 'Doctor'}</h3>
                  <span className={`badge ${apt.status === 'accepted' ? 'badge-success' : 'badge-warning'}`}>
                    {apt.status}
                  </span>
                </div>
                <p style={{ marginBottom: '0.5rem', color: 'var(--gray-600)' }}>
                  <strong>Date:</strong> {format(new Date(apt.date_time), 'PPpp')}
                </p>
                {apt.symptoms && (
                  <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    {apt.symptoms.substring(0, 100)}...
                  </p>
                )}
                <Link to="/patient/appointments" className="btn btn-sm btn-outline" style={{ textDecoration: 'none' }}>
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Medical Records */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Medical Records</h2>
          <Link to="/patient/history" className="btn btn-sm btn-outline">
            View All
          </Link>
        </div>
        {recordsCount === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No medical records yet</div>
            <div className="empty-state-description">Your medical records will appear here after visits</div>
          </div>
        ) : (
          <div>
            {dashboard.recentRecords.slice(0, 3).map((record) => (
              <div key={record.record_id} style={{ 
                padding: '1rem', 
                borderBottom: '1px solid var(--gray-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>
                      {record.record_type ? record.record_type.replace('_', ' ').toUpperCase() : 'Medical Record'}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {format(new Date(record.timestamp), 'PP')}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    {record.summary || 'No summary available'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Info */}
      {dashboard.patient.allergies && dashboard.patient.allergies.length > 0 && (
      <div className="card">
          <h2 className="card-title">Important Information</h2>
          <div>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Allergies:</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {dashboard.patient.allergies.map((allergy, idx) => (
                <span key={idx} className="badge badge-danger">
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
