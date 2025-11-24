import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { longTermPatientsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const LongTermPatients = () => {
  const [longTermPatients, setLongTermPatients] = useState([]);
  const [dueForCheck, setDueForCheck] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchLongTermPatients();
  }, []);

  const fetchLongTermPatients = async () => {
    try {
      const response = await longTermPatientsAPI.getAll();
      setLongTermPatients(response.data.patients || []);
      setDueForCheck(response.data.dueForCheckToday || []);
    } catch (error) {
      toast.error('Failed to load long-term patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (longtermId) => {
    if (!noteText.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setAddingNote(true);
    try {
      await longTermPatientsAPI.addNote(longtermId, noteText);
      toast.success('Note added successfully');
      setNoteText('');
      setSelectedPatient(null);
      fetchLongTermPatients();
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusUpdate = async (longtermId, status) => {
    try {
      await longTermPatientsAPI.updateStatus(longtermId, status);
      toast.success('Status updated');
      fetchLongTermPatients();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      monitoring: 'badge-info',
      recovered: 'badge-success',
      discharged: 'badge-secondary'
    };
    return badges[status] || 'badge-secondary';
  };

  const isDueForCheck = (nextCheckDate) => {
    return new Date(nextCheckDate) <= new Date();
  };

  if (loading) return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;

  const activePatients = longTermPatients.filter(p => p.status === 'active' || p.status === 'monitoring');

  return (
    <div className="container">
      <h1>Long-Term Patients</h1>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card success">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{activePatients.length}</div>
          <div className="stat-label">Active Patients</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏰</div>
          <div className="stat-value">{dueForCheck.length}</div>
          <div className="stat-label">Due for Check Today</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{longTermPatients.length}</div>
          <div className="stat-label">Total Long-Term</div>
        </div>
      </div>

      {/* Due for Check Today */}
      {dueForCheck.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--warning)' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>⚠️ Due for Check Today</h2>
          <div className="grid grid-2">
            {dueForCheck.map((patient) => (
              <div key={patient.longterm_id} className="card" style={{ marginBottom: 0, border: '1px solid var(--warning)' }}>
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{patient.patient?.name}</h3>
                  <span className={`badge ${getStatusBadge(patient.status)}`}>
                    {patient.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                  Next Check: {format(new Date(patient.next_check_date), 'PPpp')}
                </p>
                {patient.diagnosis && (
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <strong>Diagnosis:</strong> {patient.diagnosis}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link 
                    to={`/doctor/patient/${patient.patient_id}`} 
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    View Patient
                  </Link>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    Add Check-in
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Long-Term Patients */}
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>All Long-Term Patients</h2>
        {longTermPatients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No long-term patients</div>
            <div className="empty-state-description">
              Move patients from appointments to long-term care to track ongoing treatment
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            {longTermPatients.map((patient) => (
              <div key={patient.longterm_id} className="card" style={{ marginBottom: 0 }}>
                <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{patient.patient?.name}</h3>
                    <span className={`badge ${getStatusBadge(patient.status)}`}>
                      {patient.status}
                    </span>
                  </div>
                </div>

                {patient.diagnosis && (
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--gray-600)' }}>
                    <strong>Diagnosis:</strong> {patient.diagnosis}
                  </p>
                )}
                {patient.reason && (
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--gray-600)' }}>
                    <strong>Reason:</strong> {patient.reason}
                  </p>
                )}
                {patient.treatment_plan && (
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--gray-600)' }}>
                    <strong>Treatment:</strong> {patient.treatment_plan.substring(0, 100)}...
                  </p>
                )}

                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <strong>Check Frequency:</strong> {patient.check_frequency}
                  </p>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <strong>Last Check:</strong> {format(new Date(patient.last_check_date), 'PP')}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: isDueForCheck(patient.next_check_date) ? 'var(--warning)' : 'var(--gray-600)' }}>
                    <strong>Next Check:</strong> {format(new Date(patient.next_check_date), 'PPpp')}
                    {isDueForCheck(patient.next_check_date) && ' ⚠️ Due'}
                  </p>
                </div>

                {patient.notes && patient.notes.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Recent Notes ({patient.notes.length}):
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', maxHeight: '100px', overflowY: 'auto' }}>
                      {patient.notes.slice(-3).map((note, idx) => (
                        <div key={idx} style={{ marginBottom: '0.25rem', padding: '0.25rem', background: 'white', borderRadius: 'var(--radius-sm)' }}>
                          {format(new Date(note.date), 'MMM dd')}: {note.note.substring(0, 80)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link 
                    to={`/doctor/patient/${patient.patient_id}`} 
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', flex: 1 }}
                  >
                    View Patient
                  </Link>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => setSelectedPatient(patient)}
                    style={{ flex: 1 }}
                  >
                    📝 Check-in
                  </button>
                  {(patient.status === 'active' || patient.status === 'monitoring') && (
                    <select
                      className="btn btn-sm btn-outline"
                      value={patient.status}
                      onChange={(e) => handleStatusUpdate(patient.longterm_id, e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="active">Active</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="recovered">Recovered</option>
                      <option value="discharged">Discharged</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Daily Check-in: {selectedPatient.patient?.name}</h2>
            <div className="form-group">
              <label>Check-in Note *</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter today's check-in note, patient progress, symptoms, medication compliance, etc..."
                rows={6}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedPatient(null);
                  setNoteText('');
                }}
                disabled={addingNote}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleAddNote(selectedPatient.longterm_id)}
                disabled={addingNote || !noteText.trim()}
              >
                {addingNote ? 'Adding...' : 'Add Check-in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LongTermPatients;

