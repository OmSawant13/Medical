import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentAPI, hospitalAPI, qrAPI, doctorAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

const PatientAppointments = () => {
  const [searchParams] = useSearchParams();
  const hospitalIdFromUrl = searchParams.get('hospital');
  const doctorIdFromUrl = searchParams.get('doctor');
  
  const [appointments, setAppointments] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [formData, setFormData] = useState({
    doctor_id: '',
    date_time: '',
    symptoms: '',
    uploaded_files: null
  });
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [step, setStep] = useState('hospital'); // 'hospital' -> 'doctor' -> 'form'

  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
    if (hospitalIdFromUrl) {
      loadHospitalDoctors(hospitalIdFromUrl);
    } else if (doctorIdFromUrl) {
      loadDoctorDirect(doctorIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalIdFromUrl, doctorIdFromUrl]);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll();
      setAppointments(response.data || []);
    } catch (error) {
      toast.error('Failed to load appointments');
    }
  };

  const loadHospitalDoctors = async (hospitalId) => {
    try {
      setLoadingDoctors(true);
      const response = await hospitalAPI.getDoctors(hospitalId);
      setSelectedHospital(response.data.hospital);
      setDoctors(response.data.doctors || []);
      setStep('doctor');
      if (response.data.doctors.length === 0) {
        toast.info('No doctors available in this hospital');
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadDoctorDirect = async (doctorId) => {
    try {
      setLoadingDoctors(true);
      const response = await doctorAPI.getOne(doctorId);
      const doctor = response.data.doctor;
      setDoctors([doctor]);
      setStep('doctor');
      setFormData({ ...formData, doctor_id: doctorId });
    } catch (error) {
      console.error('Failed to load doctor:', error);
      toast.error('Failed to load doctor');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleHospitalSelect = () => {
    navigate('/patient/nearby-hospitals');
  };

  const handleDoctorSelect = (doctorId) => {
    setFormData({ ...formData, doctor_id: doctorId });
    setStep('form');
    setShowForm(true);
  };

  const handleChange = (e) => {
    if (e.target.name === 'uploaded_files') {
      setFormData({ ...formData, uploaded_files: e.target.files });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.doctor_id || !formData.date_time || !formData.symptoms.trim()) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      // Validate all required fields
      if (!formData.doctor_id || !formData.date_time || !formData.symptoms.trim()) {
        toast.error('Please fill all required fields (Date, Time, and Symptoms)');
        setLoading(false);
        return;
      }

      let dateTimeISO = formData.date_time;
      if (formData.date_time) {
        const date = new Date(formData.date_time);
        if (date instanceof Date && !isNaN(date)) {
          dateTimeISO = date.toISOString();
        } else {
          toast.error('Invalid date format. Please select a valid date and time.');
          setLoading(false);
          return;
        }
      }
      
      // Prepare appointment data
      const appointmentData = {
        doctor_id: formData.doctor_id.trim(),
        date_time: dateTimeISO,
        symptoms: formData.symptoms.trim()
      };
      
      console.log('Sending appointment data:', appointmentData);
      
      // If files are uploaded, we'll handle them separately after appointment creation
      // For now, create appointment first
      const response = await appointmentAPI.create(appointmentData);
      console.log('Appointment response:', response.data);
      
      if (response.data && response.data.appointment) {
        // If files were uploaded, handle them (optional - can be added later)
        if (formData.uploaded_files && formData.uploaded_files.length > 0) {
          toast.info('Appointment booked! Note: File uploads will be handled separately.');
        }
        
        toast.success('Appointment booked successfully! 🎉');
        setShowForm(false);
        setFormData({ doctor_id: '', date_time: '', symptoms: '', uploaded_files: null });
        setStep('hospital');
        fetchAppointments();
        navigate('/patient/appointments');
      } else {
        toast.error('Unexpected response format');
      }
    } catch (error) {
      console.error('Appointment creation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          (error.response?.data?.errors && error.response.data.errors[0]?.msg) ||
                          error.message ||
                          'Failed to create appointment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (appointmentId) => {
    try {
      const response = await qrAPI.getQR(appointmentId);
      setQrCode(response.data);
      setSelectedAppointment(appointmentId);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    try {
      await appointmentAPI.cancel(appointmentId);
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleReschedule = (appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleDateTime(new Date(appointment.date_time).toISOString().slice(0, 16));
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDateTime) {
      toast.error('Please select a new date and time');
      return;
    }
    try {
      const dateTimeISO = new Date(rescheduleDateTime).toISOString();
      await appointmentAPI.reschedule(rescheduleAppointment.appointment_id, dateTimeISO);
      toast.success('Appointment rescheduled successfully');
      setRescheduleAppointment(null);
      setRescheduleDateTime('');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      completed: 'badge-info',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const formatConsultationHours = (hours) => {
    if (!hours) return 'Not specified';
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const availableDays = days.filter(day => hours[day]?.available);
    if (availableDays.length === 0) return 'Not available';
    return availableDays.map(day => {
      const dayHours = hours[day];
      return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${dayHours.start} - ${dayHours.end}`;
    }).join(', ');
  };

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>My Appointments</h1>
        {step === 'hospital' && (
          <button 
            className="btn btn-primary" 
            onClick={handleHospitalSelect}
          >
            + Book Appointment
          </button>
        )}
        {(step === 'doctor' || step === 'form') && (
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setStep('hospital');
              setShowForm(false);
              setFormData({ doctor_id: '', date_time: '', symptoms: '', uploaded_files: [] });
              navigate('/patient/appointments');
            }}
          >
            ← Back to Hospitals
          </button>
        )}
      </div>

      {/* Hospital Selection Step */}
      {step === 'hospital' && !hospitalIdFromUrl && (
        <div className="card">
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">🏥</div>
            <div className="empty-state-title">Select a Hospital or Clinic</div>
            <div className="empty-state-description">
              Choose a hospital/clinic in your area to see available doctors and book an appointment
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleHospitalSelect}
              style={{ marginTop: '1rem' }}
            >
              Browse Hospitals →
            </button>
          </div>
        </div>
      )}

      {/* Doctor Selection Step */}
      {step === 'doctor' && selectedHospital && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{selectedHospital.name}</h2>
            <p style={{ color: 'var(--gray-600)', margin: 0 }}>
              {selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state}
            </p>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>Available Doctors</h3>
          {loadingDoctors ? (
            <div className="loading">
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem' }}>Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon">👨‍⚕️</div>
              <div className="empty-state-title">No doctors available</div>
              <div className="empty-state-description">This hospital doesn't have any doctors registered yet</div>
            </div>
          ) : (
            <div className="grid grid-3">
              {doctors.map((doctor) => (
                <div
                  key={doctor.user_id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    marginBottom: 0,
                    border: formData.doctor_id === doctor.user_id ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleDoctorSelect(doctor.user_id)}
                  onMouseEnter={(e) => {
                    if (formData.doctor_id !== doctor.user_id) {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.doctor_id !== doctor.user_id) {
                      e.currentTarget.style.borderColor = 'var(--gray-200)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👨‍⚕️</div>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{doctor.name}</h3>
                    <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {doctor.specialization}
                    </p>
                    {doctor.qualification && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                        {doctor.qualification}
                      </p>
                    )}
                    {doctor.education && doctor.education.length > 0 && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                        {doctor.education[0]}
                      </p>
                    )}
                    {doctor.experience && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                        {doctor.experience} years experience
                      </p>
                    )}
                    {doctor.consultationHours && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                        <strong>Available:</strong> {formatConsultationHours(doctor.consultationHours)}
                      </div>
                    )}
                    {doctor.availableSlots && doctor.availableSlots.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                        <strong>📅 Next Available:</strong> {format(new Date(doctor.availableSlots[0]), 'MMM dd, hh:mm a')}
                        {doctor.totalAvailableSlots > 1 && (
                          <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.7rem' }}>
                            +{doctor.totalAvailableSlots - 1} more slots
                          </span>
                        )}
                      </div>
                    )}
                    {doctor.upcomingAppointmentsCount > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                        📊 {doctor.upcomingAppointmentsCount} appointment(s) scheduled
                      </div>
                    )}
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-900)', marginTop: '0.5rem' }}>
                      ₹{doctor.consultationFee || 'N/A'}
                    </p>
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Specializes in: {doctor.specialization}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Form Step */}
      {step === 'form' && showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Book Appointment</h2>
          
          {(() => {
            const selectedDoctor = doctors.find(d => d.user_id === formData.doctor_id);
            return selectedDoctor && (
              <div className="card" style={{ 
                marginBottom: '1.5rem', 
                background: 'var(--gray-50)',
                border: '1px solid var(--primary)'
              }}>
                <div className="flex-between">
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{selectedDoctor.name}</h3>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                      {selectedDoctor.specialization} • {selectedDoctor.qualification}
                    </p>
                    <p style={{ color: 'var(--gray-600)', margin: 0 }}>
                      ₹{selectedDoctor.consultationFee} • {selectedDoctor.experience} years experience
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setStep('doctor');
                      setFormData({ ...formData, doctor_id: '' });
                    }}
                  >
                    Change Doctor
                  </button>
                </div>
              </div>
            );
          })()}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Preferred Date & Time *</label>
              <input
                type="datetime-local"
                name="date_time"
                value={formData.date_time}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 16)}
                placeholder="Select your preferred date and time"
              />
              <small style={{ color: 'var(--gray-600)', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                Select when you'd like to have your appointment
              </small>
            </div>

            <div className="form-group">
              <label>Symptoms / Reason for Visit *</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                required
                placeholder="Please describe your symptoms, concerns, or reason for the appointment in detail..."
                rows={5}
              />
              <small style={{ color: 'var(--gray-600)', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                Provide as much detail as possible to help the doctor prepare
              </small>
            </div>

            <div className="form-group">
              <label>Upload Files (Optional)</label>
              <input
                type="file"
                name="uploaded_files"
                onChange={handleChange}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <small style={{ color: 'var(--gray-600)', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                You can upload previous reports, prescriptions, or test results (PDF, Images, Word documents)
              </small>
              {formData.uploaded_files && formData.uploaded_files.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    📎 {formData.uploaded_files.length} file(s) selected
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setStep('doctor');
                      setFormData({ ...formData, doctor_id: '' });
                    }}
                    disabled={loading}
                  >
                    ← Back to Doctors
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '150px' }}>
                    {loading ? (
                      <>
                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                        Booking...
                      </>
                    ) : (
                      '📅 Book Appointment'
                    )}
                  </button>
                </div>
            </div>
          </form>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppointment && (
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
            <h2 style={{ marginBottom: '1rem' }}>Reschedule Appointment</h2>
            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label>New Date & Time *</label>
                <input
                  type="datetime-local"
                  value={rescheduleDateTime}
                  onChange={(e) => setRescheduleDateTime(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setRescheduleAppointment(null);
                    setRescheduleDateTime('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>My Appointments</h2>
        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No appointments yet</div>
            <div className="empty-state-description">Book your first appointment to get started</div>
            <button 
              className="btn btn-primary" 
              onClick={handleHospitalSelect}
              style={{ marginTop: '1rem' }}
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {appointments.map((apt) => (
              <div key={apt.appointment_id} className="card" style={{ marginBottom: 0 }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>Appointment #{apt.appointment_id.slice(-6)}</h3>
                    <span className={`badge ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '0.5rem', color: 'var(--gray-600)' }}>
                    <strong>Date:</strong> {format(new Date(apt.date_time), 'PPpp')}
                  </p>
                  {apt.symptoms && (
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      <strong>Symptoms:</strong> {apt.symptoms}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {apt.status !== 'completed' && !apt.visit_completed && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleGenerateQR(apt.appointment_id)}
                        style={{ flex: 1 }}
                      >
                        📱 QR Code
                      </button>
                      {apt.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleReschedule(apt)}
                            style={{ flex: 1 }}
                          >
                            📅 Reschedule
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(apt.appointment_id)}
                            style={{ flex: 1 }}
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {qrCode && selectedAppointment === apt.appointment_id && (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    padding: '1.5rem', 
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <QRCodeSVG value={qrCode.qr_code} size={200} />
                    <p style={{ marginTop: '1rem', fontWeight: 600 }}>Scan this QR code at your appointment</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                      Expires: {format(new Date(qrCode.expires_at), 'PPpp')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;
