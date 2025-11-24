import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doctorAPI, medicalRecordsAPI, familyHistoryAPI, aiAPI, appointmentAPI, hospitalAPI, longTermPatientsAPI, followUpsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const DoctorPatientView = () => {
  const { patientId } = useParams();
  const [patientView, setPatientView] = useState(null);
  const [familyHistory, setFamilyHistory] = useState(null);
  const [showFamilyHistory, setShowFamilyHistory] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLongTermModal, setShowLongTermModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [referData, setReferData] = useState({ hospital_id: '', reason: '' });
  const [followUpData, setFollowUpData] = useState({ scheduled_date: '', reason: '' });
  const [uploadData, setUploadData] = useState({
    summary: '',
    record_type: 'prescription',
    files: null,
    appointment_id: ''
  });
  const [longTermData, setLongTermData] = useState({
    reason: '',
    diagnosis: '',
    treatment_plan: '',
    check_frequency: 'daily'
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientView();
    fetchHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchHospitals = async () => {
    try {
      const response = await hospitalAPI.searchHospitals();
      setHospitals(response.data.hospitals || response.data || []);
    } catch (error) {
      console.error('Failed to load hospitals');
      setHospitals([]);
    }
  };

  const fetchPatientView = async () => {
    try {
      const response = await doctorAPI.getPatientView(patientId);
      setPatientView(response.data);
    } catch (error) {
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };


  const fetchFamilyHistory = async () => {
    try {
      const response = await familyHistoryAPI.get(patientId);
      setFamilyHistory(response.data);
      setShowFamilyHistory(true);
    } catch (error) {
      toast.error('Failed to load family history');
    }
  };

  const [analyzingRecord, setAnalyzingRecord] = useState(null);

  const handleAnalyzeReport = async (recordId) => {
    setAnalyzingRecord(recordId);
    try {
      await aiAPI.analyzeReport(recordId);
      toast.success('Report analyzed successfully! AI analysis complete.');
      fetchPatientView();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze report. Please try again.');
    } finally {
      setAnalyzingRecord(null);
    }
  };

  const handleRefer = async (e) => {
    e.preventDefault();
    try {
      await doctorAPI.referPatient({
        patient_id: patientId,
        hospital_id: referData.hospital_id,
        reason: referData.reason
      });
      toast.success('Patient referred successfully!');
      setShowReferModal(false);
      setReferData({ hospital_id: '', reason: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refer patient');
    }
  };

  const handleCompleteAppointment = async () => {
    if (!patientView.currentAppointment) return;
    try {
      await appointmentAPI.updateStatus(patientView.currentAppointment.appointment_id, 'completed');
      toast.success('Appointment completed');
      setUploadData({ ...uploadData, appointment_id: patientView.currentAppointment.appointment_id });
      setShowUploadModal(true);
      fetchPatientView();
    } catch (error) {
      toast.error('Failed to complete appointment');
    }
  };

  const handleFileChange = (e) => {
    setUploadData({ ...uploadData, files: e.target.files });
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpData.scheduled_date) {
      toast.error('Please select a date');
      return;
    }

    try {
      await followUpsAPI.create({
        patient_id: patientId,
        scheduled_date: new Date(followUpData.scheduled_date).toISOString(),
        reason: followUpData.reason,
        appointment_id: patientView.currentAppointment?.appointment_id
      });
      toast.success('Follow-up scheduled successfully!');
      setShowFollowUpModal(false);
      setFollowUpData({ scheduled_date: '', reason: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule follow-up');
    }
  };

  const handleAddToLongTerm = async (e) => {
    e.preventDefault();
    if (!longTermData.reason.trim() || !longTermData.diagnosis.trim()) {
      toast.error('Please fill reason and diagnosis');
      return;
    }

    try {
      await longTermPatientsAPI.add({
        patient_id: patientId,
        reason: longTermData.reason,
        diagnosis: longTermData.diagnosis,
        treatment_plan: longTermData.treatment_plan,
        check_frequency: longTermData.check_frequency,
        appointment_id: patientView.currentAppointment?.appointment_id
      });
      toast.success('Patient added to long-term care!');
      setShowLongTermModal(false);
      setLongTermData({ reason: '', diagnosis: '', treatment_plan: '', check_frequency: 'daily' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to long-term care');
    }
  };

  const handleUploadRecord = async (e) => {
    e.preventDefault();
    if (!uploadData.summary.trim()) {
      toast.error('Please enter a summary');
      return;
    }

    setUploadLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('patient_id', patientId);
      formDataToSend.append('summary', uploadData.summary);
      formDataToSend.append('record_type', uploadData.record_type);
      if (uploadData.appointment_id) {
        formDataToSend.append('appointment_id', uploadData.appointment_id);
      }
      
      if (uploadData.files) {
        Array.from(uploadData.files).forEach(file => {
          formDataToSend.append('files', file);
        });
      }

      await medicalRecordsAPI.upload(formDataToSend);
      toast.success('Medical record uploaded successfully!');
      setShowUploadModal(false);
      setUploadData({ summary: '', record_type: 'prescription', files: null, appointment_id: '' });
      fetchPatientView();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload record');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!patientView) return <div>Patient not found</div>;

  return (
    <div>
      <h1>Patient View: {patientView.patient.name}</h1>

      <div className="card">
        <h2>Patient Information</h2>
        <p><strong>Patient ID:</strong> {patientView.patient.user_id}</p>
        <p><strong>Allergies:</strong> {patientView.patient.allergies?.join(', ') || 'None'}</p>
        {patientView.currentAppointment && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#e3f2fd', borderRadius: '5px' }}>
            <p><strong>Current Visit Reason:</strong> {patientView.currentAppointment.symptoms}</p>
            <p><strong>Appointment Date:</strong> {format(new Date(patientView.currentAppointment.date_time), 'PPpp')}</p>
            <button className="btn btn-success" onClick={handleCompleteAppointment} style={{ marginTop: '10px' }}>
              Complete Visit
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Medical Timeline (Read-Only)</h2>
        {patientView.medicalTimeline.length === 0 ? (
          <p>No medical records</p>
        ) : (
          <div>
            {patientView.medicalTimeline.map((record) => (
              <div key={record.record_id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                <p><strong>Date:</strong> {format(new Date(record.timestamp), 'PP')}</p>
                <p><strong>Summary:</strong> {record.summary || 'No summary'}</p>
                {record.ai_summary && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                    <p><strong>AI Analysis:</strong> {record.ai_summary}</p>
                  </div>
                )}
                {record.doctor_id && <p><strong>Doctor:</strong> {record.doctor_id.name}</p>}
                {record.hospital_id && <p><strong>Hospital:</strong> {record.hospital_id.name}</p>}
                {record.files && record.files.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      <strong>Attached Files:</strong> {record.files.length} file(s)
                      {record.record_type === 'xray' && ' 📷 X-Ray Image'}
                      {record.record_type === 'lab_test' && ' 🧪 Lab Report'}
                    </p>
                  </div>
                )}
                {analyzingRecord === record.record_id ? (
                  <button className="btn btn-secondary" disabled style={{ marginTop: '10px' }}>
                    <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', display: 'inline-block', marginRight: '8px' }}></div>
                    Analyzing...
                  </button>
                ) : !record.ai_summary ? (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleAnalyzeReport(record.record_id)} 
                    style={{ marginTop: '10px' }}
                  >
                    🤖 AI Report Analysis {record.files && record.files.length > 0 && '(Image + Text)'}
                  </button>
                ) : (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '5px', fontSize: '0.875rem' }}>
                    ✅ AI Analysis Complete
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={fetchFamilyHistory}>
            View Family History
          </button>
          <button className="btn btn-success" onClick={() => setShowUploadModal(true)}>
            Upload Medical Record
          </button>
          <button className="btn btn-info" onClick={() => setShowFollowUpModal(true)}>
            📅 Schedule Follow-Up
          </button>
          <button className="btn btn-warning" onClick={() => setShowLongTermModal(true)}>
            ➕ Add to Long-Term Care
          </button>
          <button className="btn btn-secondary" onClick={() => setShowReferModal(true)}>
            Refer to Hospital
          </button>
        </div>
      </div>

      {showFamilyHistory && familyHistory && (
        <div className="card" style={{ background: '#fff9e6', marginTop: '20px' }}>
          <h2>Family History</h2>
          {familyHistory.medical_pattern?.summary && (
            <div style={{ padding: '15px', background: 'white', borderRadius: '5px', marginBottom: '15px' }}>
              <h3>Hereditary Pattern Summary</h3>
              <p>{familyHistory.medical_pattern.summary}</p>
              {familyHistory.medical_pattern.hereditary_diseases && familyHistory.medical_pattern.hereditary_diseases.length > 0 && (
                <p><strong>Identified Patterns:</strong> {familyHistory.medical_pattern.hereditary_diseases.join(', ')}</p>
              )}
            </div>
          )}
          <p><strong>Family Members:</strong> {familyHistory.members.length}</p>
          <p><strong>Total Records:</strong> {familyHistory.records.length}</p>
          <button className="btn btn-secondary" onClick={() => setShowFamilyHistory(false)} style={{ marginTop: '10px' }}>
            Close
          </button>
        </div>
      )}

      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Upload Medical Record</h2>
            <form onSubmit={handleUploadRecord}>
              <div className="form-group">
                <label>Record Type</label>
                <select
                  value={uploadData.record_type}
                  onChange={(e) => setUploadData({ ...uploadData, record_type: e.target.value })}
                  required
                >
                  <option value="prescription">Prescription</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="xray">X-Ray</option>
                  <option value="discharge_summary">Discharge Summary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Summary / Notes *</label>
                <textarea
                  value={uploadData.summary}
                  onChange={(e) => setUploadData({ ...uploadData, summary: e.target.value })}
                  required
                  placeholder="Enter diagnosis, prescription details, test results, etc..."
                  rows={6}
                />
              </div>
              <div className="form-group">
                <label>Upload Files (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <small style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                  Supported formats: PDF, Images, Word documents
                </small>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData({ summary: '', record_type: 'prescription', files: null, appointment_id: '' });
                  }}
                  disabled={uploadLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadLoading}>
                  {uploadLoading ? 'Uploading...' : 'Upload Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
            <h2>Schedule Follow-Up Appointment</h2>
            <form onSubmit={handleScheduleFollowUp}>
              <div className="form-group">
                <label>Follow-Up Date & Time *</label>
                <input
                  type="datetime-local"
                  value={followUpData.scheduled_date}
                  onChange={(e) => setFollowUpData({ ...followUpData, scheduled_date: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="form-group">
                <label>Reason (Optional)</label>
                <textarea
                  value={followUpData.reason}
                  onChange={(e) => setFollowUpData({ ...followUpData, reason: e.target.value })}
                  placeholder="Reason for follow-up..."
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowFollowUpModal(false);
                    setFollowUpData({ scheduled_date: '', reason: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLongTermModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Add Patient to Long-Term Care</h2>
            <form onSubmit={handleAddToLongTerm}>
              <div className="form-group">
                <label>Reason for Long-Term Care *</label>
                <textarea
                  value={longTermData.reason}
                  onChange={(e) => setLongTermData({ ...longTermData, reason: e.target.value })}
                  required
                  placeholder="Why does this patient need long-term care? (e.g., chronic condition, ongoing treatment)"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Diagnosis *</label>
                <input
                  type="text"
                  value={longTermData.diagnosis}
                  onChange={(e) => setLongTermData({ ...longTermData, diagnosis: e.target.value })}
                  required
                  placeholder="e.g., Type 2 Diabetes, Hypertension, Post-surgery recovery"
                />
              </div>
              <div className="form-group">
                <label>Treatment Plan</label>
                <textarea
                  value={longTermData.treatment_plan}
                  onChange={(e) => setLongTermData({ ...longTermData, treatment_plan: e.target.value })}
                  placeholder="Describe the ongoing treatment plan..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Check Frequency *</label>
                <select
                  value={longTermData.check_frequency}
                  onChange={(e) => setLongTermData({ ...longTermData, check_frequency: e.target.value })}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <small style={{ color: 'var(--gray-600)', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                  How often you want to check on this patient
                </small>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLongTermModal(false);
                    setLongTermData({ reason: '', diagnosis: '', treatment_plan: '', check_frequency: 'daily' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning">
                  Add to Long-Term Care
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReferModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px' }}>
            <h2>Refer Patient to Hospital</h2>
            <form onSubmit={handleRefer}>
              <div className="form-group">
                <label>Select Hospital</label>
                <select
                  value={referData.hospital_id}
                  onChange={(e) => setReferData({ ...referData, hospital_id: e.target.value })}
                  required
                >
                  <option value="">Choose a hospital...</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.user_id} value={hospital.user_id}>
                      {hospital.name} ({hospital.user_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Reason for Referral</label>
                <textarea
                  value={referData.reason}
                  onChange={(e) => setReferData({ ...referData, reason: e.target.value })}
                  required
                  placeholder="Describe the reason for referral..."
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">
                  Submit Referral
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReferModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientView;

