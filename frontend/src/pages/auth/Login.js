import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = response.data.user.role;
      if (role === 'patient') {
        navigate('/patient/dashboard');
      } else if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (role === 'hospital') {
        navigate('/hospital/dashboard');
      }
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '420px',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '0.5rem',
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🏥
          </div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: 'var(--gray-900)'
          }}>
            Health-Link
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--gray-200)'
        }}>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', margin: 0 }}>
            Don't have an account?{' '}
            <a 
              href="/register" 
              style={{ 
                color: 'var(--primary)', 
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Register here
            </a>
          </p>
        </div>

        {/* Demo Credentials */}
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.75rem',
          color: 'var(--gray-600)'
        }}>
          <strong>Demo:</strong> om@patient.com / Patient123
        </div>
      </div>
    </div>
  );
};

export default Login;
