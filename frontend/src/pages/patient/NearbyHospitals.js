import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalAPI } from '../../services/api';
import { toast } from 'react-toastify';

const NearbyHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState({
    city: '',
    state: '',
    name: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSearchData({ ...searchData, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchData.city && !searchData.state && !searchData.name) {
      toast.error('Please enter at least city or hospital name');
      return;
    }

    setLoading(true);
    try {
      const response = await hospitalAPI.searchHospitals(searchData);
      const hospitalsList = response.data.hospitals || response.data || [];
      setHospitals(hospitalsList);
      if (hospitalsList.length === 0) {
        toast.info('No hospitals found. Try different search criteria.');
      } else {
        toast.success(`Found ${hospitalsList.length} hospitals`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search hospitals');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = (hospitalId) => {
    navigate(`/patient/appointments?hospital=${hospitalId}`);
  };

  return (
    <div className="container">
      <h1>Find Hospitals & Clinics</h1>

      <div className="card">
        <h2>Search Hospitals</h2>
        <form onSubmit={handleSearch}>
          <div className="grid grid-3">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={searchData.city}
                onChange={handleChange}
                placeholder="e.g., Mumbai"
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={searchData.state}
                onChange={handleChange}
                placeholder="e.g., Maharashtra"
              />
            </div>
            <div className="form-group">
              <label>Hospital Name (Optional)</label>
              <input
                type="text"
                name="name"
                value={searchData.name}
                onChange={handleChange}
                placeholder="Search by name..."
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Searching...
              </>
            ) : (
              '🔍 Search Hospitals'
            )}
          </button>
        </form>
      </div>

      {hospitals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Found Hospitals ({hospitals.length})</h2>
          </div>
          <div className="grid grid-2">
            {hospitals.map((hospital) => (
              <div 
                key={hospital.user_id} 
                className="card" 
                style={{ 
                  marginBottom: 0,
                  cursor: 'pointer',
                  border: '1px solid var(--gray-200)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleSelectHospital(hospital.user_id)}
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
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                  <div style={{ 
                    fontSize: '2.5rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    🏥
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                      {hospital.name}
                    </h3>
                    {(hospital.city || hospital.state) && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                        📍 {hospital.city}{hospital.city && hospital.state ? ', ' : ''}{hospital.state}
                      </p>
                )}
                    {hospital.address && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                        {hospital.address}
                      </p>
                    )}
                    {hospital.phone && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                        📞 {hospital.phone}
                      </p>
                    )}
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem', width: '100%' }}>
                      👨‍⚕️ View Available Doctors →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hospitals.length === 0 && !loading && (
        <div className="card">
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-state-icon">🏥</div>
            <div className="empty-state-title">No hospitals found</div>
            <div className="empty-state-description">
              Try searching with different city or state
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyHospitals;
