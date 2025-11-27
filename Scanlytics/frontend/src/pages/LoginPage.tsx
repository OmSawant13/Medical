import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<string>('patient');
  const [formData, setFormData] = useState({
    email: 'admin@test.com',
    password: 'password'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const roleFromURL = searchParams.get('role');
    if (roleFromURL) {
      setSelectedRole(roleFromURL);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      const response = await fetch('http://localhost:5001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        localStorage.setItem('userRole', selectedRole);
        localStorage.setItem('authToken', data.data.token);

        // Navigate based on role
        switch (selectedRole) {
          case 'patient':
            navigate('/patient-dashboard');
            break;
          case 'doctor':
            navigate('/doctor-dashboard');
            break;
          case 'hospital':
            navigate('/hospital-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please check if the backend server is running.');
    }

    setIsLoading(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'patient': return '👤';
      case 'doctor': return '👨‍⚕️';
      case 'hospital': return '🏥';
      default: return '👤';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'patient': return 'Access your medical records, scan results, and appointments';
      case 'doctor': return 'Review AI analysis, manage patients, and approve medical findings';
      case 'hospital': return 'Upload scans, manage schedules, and track system analytics';
      default: return 'Healthcare management platform';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">🏥 Healthcare AI</h1>
          </Link>
          <p className="text-gray-600">Sign in to your portal</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Your Role</label>
            <div className="grid grid-cols-3 gap-3">
              {['patient', 'doctor', 'hospital'].map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedRole === role
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{getRoleIcon(role)}</div>
                  <div className="text-xs font-medium capitalize">{role}</div>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {getRoleDescription(selectedRole)}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <>
                  {getRoleIcon(selectedRole)} Sign in as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">🔑 Demo Credentials</h4>
            <div className="text-sm text-yellow-700">
              <p><strong>Email:</strong> admin@test.com</p>
              <p><strong>Password:</strong> password</p>
              <p className="mt-2 text-xs">Works for all roles (Patient, Doctor, Hospital)</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
