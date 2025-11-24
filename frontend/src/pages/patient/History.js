import React, { useState, useEffect } from 'react';
import { patientAPI, aiAPI, accessLogsAPI, shareHistoryAPI, doctorAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const PatientHistory = () => {
  const [history, setHistory] = useState(null);
  const [accessLogs, setAccessLogs] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({ doctor_id: '', duration_hours: 24 });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchHistory();
    fetchAccessLogs();
    fetchSharedLinks();
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await patientAPI.getHistory(user.user_id);
      setHistory(response.data);
    } catch (error) {
      toast.error('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessLogs = async () => {
    try {
      const response = await accessLogsAPI.getAll();
      setAccessLogs(response.data || []);
    } catch (error) {
      console.error('Failed to load access logs');
    }
  };

  const fetchSharedLinks = async () => {
    try {
      const response = await shareHistoryAPI.getAll();
      setSharedLinks(response.data.shares || []);
    } catch (error) {
      console.error('Failed to load shared links');
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.searchDoctors();
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Failed to load doctors');
    }
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    try {
      const response = await aiAPI.summarizeHealth();
      setAiSummary(response.data);
      toast.success('Health summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleShareHistory = async (e) => {
    e.preventDefault();
    try {
      await shareHistoryAPI.create(shareData.doctor_id, shareData.duration_hours);
      toast.success('Medical history shared successfully!');
      setShowShareModal(false);
      setShareData({ doctor_id: '', duration_hours: 24 });
      fetchSharedLinks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share history');
    }
  };

  const handleRevokeShare = async (shareId) => {
    try {
      await shareHistoryAPI.revoke(shareId);
      toast.success('Share link revoked');
      fetchSharedLinks();
    } catch (error) {
      toast.error('Failed to revoke share');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;
  if (!history) return <div className="empty-state"><div className="empty-state-title">No data available</div></div>;

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Health Locker</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
            🔗 Share History
          </button>
          <button className="btn btn-primary" onClick={handleSummarize} disabled={summaryLoading}>
            {summaryLoading ? 'Generating...' : '🤖 AI Summary'}
          </button>
        </div>
      </div>

      {aiSummary && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>🤖 AI Health Summary</h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '1rem' }}>{aiSummary.summary}</p>
          {aiSummary.keyFindings && aiSummary.keyFindings.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Key Findings:</h3>
              <ul style={{ marginLeft: '1.5rem' }}>
                {aiSummary.keyFindings.map((finding, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{finding}</li>
                ))}
              </ul>
            </div>
          )}
          {aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Recommendations:</h3>
              <ul style={{ marginLeft: '1.5rem' }}>
                {aiSummary.recommendations.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Share History Modal */}
      {showShareModal && (
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
          <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Share Medical History</h2>
            <form onSubmit={handleShareHistory}>
              <div className="form-group">
                <label>Select Doctor</label>
                <select
                  value={shareData.doctor_id}
                  onChange={(e) => setShareData({ ...shareData, doctor_id: e.target.value })}
                  required
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.user_id} value={doctor.user_id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={shareData.duration_hours}
                  onChange={(e) => setShareData({ ...shareData, duration_hours: parseInt(e.target.value) })}
                  required
                />
                <small style={{ color: 'var(--gray-600)' }}>Link will expire after {shareData.duration_hours} hours</small>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowShareModal(false);
                    setShareData({ doctor_id: '', duration_hours: 24 });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Links */}
      {sharedLinks.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Shared Links</h2>
          <div className="grid grid-2">
            {sharedLinks.map((share) => (
              <div key={share.share_id} className="card" style={{ marginBottom: 0, background: 'var(--gray-50)' }}>
                <div className="flex-between">
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      Shared with: {share.shared_with?.name || 'Unknown'}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                      Expires: {format(new Date(share.expires_at), 'PPpp')}
                    </p>
                    <span className={`badge ${share.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {share.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  {share.isActive && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRevokeShare(share.share_id)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Timeline */}
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Medical Timeline</h2>
        {history.timeline.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No medical records yet</div>
            <div className="empty-state-description">Your medical records will appear here</div>
          </div>
        ) : (
          <div>
            {history.timeline.map((item, idx) => (
              <div key={idx} className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className={`badge ${item.type === 'record' ? 'badge-info' : 'badge-warning'}`}>
                        {item.type === 'record' ? '📄 Medical Record' : '📅 Appointment'}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {format(new Date(item.date), 'PPpp')}
                      </span>
                    </div>
                    {item.type === 'record' && (
                      <>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Summary:</strong> {item.data.summary || 'No summary'}</p>
                        {item.data.record_type && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                            Type: {item.data.record_type.replace('_', ' ').toUpperCase()}
                          </p>
                        )}
                        {item.data.doctor_id && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                            Doctor: {item.data.doctor_id.name}
                          </p>
                        )}
                        {item.data.hospital_id && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                            Hospital: {item.data.hospital_id.name}
                          </p>
                        )}
                        {item.data.files && item.data.files.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong style={{ fontSize: '0.875rem' }}>Files:</strong>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                              {item.data.files.map((file, fileIdx) => {
                                const filename = file.split('/').pop();
                                const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename);
                                return (
                                  <a
                                    key={fileIdx}
                                    href={`http://localhost:5001/api/medical-records/files/${filename}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '5px 10px',
                                      background: 'var(--gray-50)',
                                      borderRadius: 'var(--radius-sm)',
                                      color: 'var(--primary)',
                                      textDecoration: 'none',
                                      fontSize: '0.875rem',
                                      border: '1px solid var(--gray-200)',
                                      marginRight: '5px',
                                      marginTop: '5px'
                                    }}
                                  >
                                    {isImage ? '📷' : '📎'} {filename}
                                  </a>
                                );
                              })}
                            </div>
                            {item.data.record_type === 'xray' && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: '5px' }}>
                                💡 X-Ray images can be analyzed using AI (Doctor can analyze)
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {item.type === 'appointment' && (
                      <>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Symptoms:</strong> {item.data.symptoms}</p>
                        {item.data.doctor_id && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            Doctor: {item.data.doctor_id.name}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access Logs */}
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Access Logs</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
          See who has accessed your medical data
        </p>
        {accessLogs.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem' }}>
            <p>No access logs yet</p>
          </div>
        ) : (
          <div>
            {accessLogs.map((log) => (
              <div key={log.log_id} style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                <div className="flex-between">
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {log.accessed_by?.name} ({log.accessed_by?.role})
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                      Action: {log.access_type}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {format(new Date(log.timestamp), 'PPpp')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
