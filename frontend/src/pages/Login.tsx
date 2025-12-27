import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'patient';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: role,
    doctorId: '',
    hospitalId: '',
    patientId: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock validation
      if (formData.email === 'admin@test.com' && formData.password === 'password') {
        // Generate mock IDs if not provided
        const userData = {
          ...formData,
          patientId: formData.patientId || 'P' + Date.now().toString().slice(-6),
          doctorId: formData.doctorId || 'D' + Date.now().toString().slice(-6),
          hospitalId: formData.hospitalId || 'H' + Date.now().toString().slice(-6)
        };
        
        // Store user data
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userRole', formData.role);
        
        // Redirect to appropriate dashboard
        switch (formData.role) {
          case 'patient':
            navigate('/patient/dashboard');
            break;
          case 'doctor':
            navigate('/doctor/dashboard');
            break;
          case 'hospital':
            navigate('/hospital/dashboard');
            break;
          default:
            navigate('/patient/dashboard');
        }
      } else {
        setErrors({ general: 'Invalid credentials. Try: admin@test.com / password' });
      }
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'doctor': return '👨‍⚕️';
      case 'hospital': return '🏥';
      default: return '👤';
    }
  };

  const getRoleSpecificFields = () => {
    switch (role) {
      case 'doctor':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Doctor ID <span className="text-gray-500">(Optional - will be auto-generated)</span>
            </label>
            <input
              type="text"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Enter your Doctor ID or leave blank"
            />
          </div>
        );
      case 'hospital':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hospital ID <span className="text-gray-500">(Optional - will be auto-generated)</span>
            </label>
            <input
              type="text"
              name="hospitalId"
              value={formData.hospitalId}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your Hospital ID or leave blank"
            />
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Patient ID <span className="text-gray-500">(Optional - will be auto-generated for new patients)</span>
            </label>
            <input
              type="text"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Leave blank if you're a new patient"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <h2 className="text-4xl font-bold text-blue-600">🏥 Healthcare AI</h2>
        </Link>
        <div className="text-center">
          <div className="text-6xl mb-4">{getRoleIcon()}</div>
          <h2 className="text-3xl font-bold text-gray-900">
            {role.charAt(0).toUpperCase() + role.slice(1)} Login
          </h2>
          <p className="text-gray-600 mt-2">
            Welcome back! Please sign in to your account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-8 shadow-xl rounded-2xl">
          {/* Demo Credentials */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <h4 className="font-semibold text-yellow-800 mb-2">🔑 Demo Credentials</h4>
            <p className="text-sm text-yellow-700">
              <strong>Email:</strong> admin@test.com<br/>
              <strong>Password:</strong> password
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            {getRoleSpecificFields()}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Login As</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="patient">👤 Patient</option>
                <option value="doctor">👨‍⚕️ Doctor</option>
                <option value="hospital">🏥 Hospital</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white font-semibold bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : 'transform hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  `🚀 Sign In to ${role.charAt(0).toUpperCase() + role.slice(1)} Portal`
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to Healthcare AI?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-3 px-4 border-2 border-blue-300 rounded-lg shadow-sm text-blue-700 bg-white hover:bg-blue-50 font-semibold transition-all duration-200 transform hover:scale-105"
              >
                ✨ Create New Account
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
