import React, { useState, useEffect } from 'react';
import { patientAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PatientSettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    allergies: ''
  });
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await patientAPI.getProfile(user.user_id);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        allergies: Array.isArray(response.data.allergies) ? response.data.allergies.join(', ') : ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(a => a)
      };
      await patientAPI.updateProfile(data);
      toast.success('Profile updated successfully!');
      // Update local storage
      const updatedUser = { ...user, name: formData.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      <div className="card">
        <h2>Profile Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Allergies (comma-separated)</label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g., Peanuts, Penicillin, Pollen"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Account Information</h2>
        <p><strong>Patient ID:</strong> {user.user_id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Family ID:</strong> {user.family_id || 'Not linked'}</p>
      </div>
    </div>
  );
};

export default PatientSettings;

