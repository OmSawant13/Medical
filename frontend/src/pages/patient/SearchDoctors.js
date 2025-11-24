import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import { toast } from 'react-toastify';

const SearchDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    specialization: '',
    city: '',
    minFee: '',
    maxFee: '',
    availability: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    searchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.city) params.city = filters.city;
      if (filters.minFee) params.minFee = filters.minFee;
      if (filters.maxFee) params.maxFee = filters.maxFee;
      if (filters.availability) params.availability = filters.availability;

      const response = await doctorAPI.searchDoctors(params);
      setDoctors(response.data.doctors || []);
      if (response.data.doctors.length === 0) {
        toast.info('No doctors found. Try different filters.');
      }
    } catch (error) {
      toast.error('Failed to search doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchDoctors();
  };

  const handleSelectDoctor = (doctorId) => {
    navigate(`/patient/appointments?doctor=${doctorId}`);
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
      <h1>Search Doctors</h1>

      <div className="card">
        <h2>Find a Doctor</h2>
        <form onSubmit={handleSearch}>
          <div className="grid grid-3">
            <div className="form-group">
              <label>Doctor Name</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleChange}
                placeholder="e.g., Dr. Sharma"
              />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="specialization"
                value={filters.specialization}
                onChange={handleChange}
                placeholder="e.g., Cardiologist"
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleChange}
                placeholder="e.g., Mumbai"
              />
            </div>
            <div className="form-group">
              <label>Min Fee (₹)</label>
              <input
                type="number"
                name="minFee"
                value={filters.minFee}
                onChange={handleChange}
                placeholder="Min"
              />
            </div>
            <div className="form-group">
              <label>Max Fee (₹)</label>
              <input
                type="number"
                name="maxFee"
                value={filters.maxFee}
                onChange={handleChange}
                placeholder="Max"
              />
            </div>
            <div className="form-group">
              <label>Availability</label>
              <select
                name="availability"
                value={filters.availability}
                onChange={handleChange}
              >
                <option value="">All</option>
                <option value="today">Available Today</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Searching...
              </>
            ) : (
              '🔍 Search Doctors'
            )}
          </button>
        </form>
      </div>

      {doctors.length > 0 && (
        <div className="card">
          <h2>Found Doctors ({doctors.length})</h2>
          <div className="grid grid-3">
            {doctors.map((doctor) => (
              <div
                key={doctor.user_id}
                className="card"
                style={{
                  cursor: 'pointer',
                  marginBottom: 0,
                  border: '1px solid var(--gray-200)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleSelectDoctor(doctor.user_id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
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
                  {doctor.experience && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {doctor.experience} years experience
                    </p>
                  )}
                  {doctor.consultationHours && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                      {formatConsultationHours(doctor.consultationHours)}
                    </div>
                  )}
                  {doctor.clinicName && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                      {doctor.clinicName}
                    </p>
                  )}
                  {(doctor.city || doctor.state) && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                      📍 {doctor.city}{doctor.city && doctor.state ? ', ' : ''}{doctor.state}
                    </p>
                  )}
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-900)', marginTop: '0.5rem' }}>
                    ₹{doctor.consultationFee || 'N/A'}
                  </p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem', width: '100%' }}>
                    Book Appointment →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {doctors.length === 0 && !loading && (
        <div className="card">
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-state-icon">👨‍⚕️</div>
            <div className="empty-state-title">No doctors found</div>
            <div className="empty-state-description">
              Try adjusting your search filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDoctors;

