import React, { useState } from 'react';
import { hospitalAPI, medicalRecordsAPI, appointmentAPI } from '../../services/api';
import { toast } from 'react-toastify';

const HospitalDashboard = () => {
  const [patientId, setPatientId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    summary: '',
    record_type: 'other',
    files: null
  });
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!patientId && !qrCode) {
      toast.error('Please enter Patient ID or scan QR code');
      return;
    }

    try {
      let lookupId = patientId;
      
      // If QR code provided, parse it
      if (qrCode && !patientId) {
        try {
          const qrData = JSON.parse(qrCode);
          const appointment = await appointmentAPI.scanQR(qrData.appointment_id, qrCode);
          lookupId = appointment.data.patient.user_id;
        } catch (error) {
          toast.error('Invalid QR code');
          return;
        }
      }

      const response = await hospitalAPI.lookupPatient(lookupId);
      setPatient(response.data);
      setFormData({ ...formData, patient_id: lookupId });
      toast.success('Patient found');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Patient not found');
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, files: e.target.files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast.error('Please lookup patient first');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('patient_id', formData.patient_id);
      formDataToSend.append('summary', formData.summary);
      formDataToSend.append('record_type', formData.record_type);
      
      if (formData.files) {
        Array.from(formData.files).forEach(file => {
          formDataToSend.append('files', file);
        });
      }

      await medicalRecordsAPI.upload(formDataToSend);
      toast.success('Report uploaded successfully!');
      setFormData({ patient_id: formData.patient_id, summary: '', record_type: 'other', files: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Hospital Dashboard</h1>

      <div className="card">
        <h2>Patient Lookup</h2>
        <form onSubmit={handleLookup}>
          <div className="form-group">
            <label>Patient ID</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter Patient ID"
            />
          </div>
          <div className="form-group">
            <label>Or Scan QR Code</label>
            <textarea
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Paste QR code data here"
              rows="3"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Lookup Patient
          </button>
        </form>
      </div>

      {patient && (
        <div className="card">
          <h2>Patient Information (Read-Only)</h2>
          <p><strong>Patient ID:</strong> {patient.patient_id}</p>
          <p><strong>Name:</strong> {patient.name}</p>
          {patient.allergies && patient.allergies.length > 0 && (
            <p><strong>Allergies:</strong> {patient.allergies.join(', ')}</p>
          )}
        </div>
      )}

      {patient && (
        <div className="card">
          <h2>Add Report</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Record Type</label>
              <select
                value={formData.record_type}
                onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                required
              >
                <option value="lab_test">Lab Test</option>
                <option value="xray">X-Ray</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="prescription">Prescription</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Summary</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Enter report summary..."
                required
              />
            </div>
            <div className="form-group">
              <label>Upload Files</label>
              <input type="file" multiple onChange={handleFileChange} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Report'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ background: '#fff3cd', marginTop: '20px' }}>
        <h3>Note</h3>
        <p>Hospitals have read-only access to patient data. You can upload reports but cannot view or download patient medical history.</p>
      </div>
    </div>
  );
};

export default HospitalDashboard;

