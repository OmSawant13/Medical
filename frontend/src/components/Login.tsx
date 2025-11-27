import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | 'hospital'>('patient');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Get role from URL params if available
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const roleParam = urlParams.get('role') as 'patient' | 'doctor' | 'hospital';
    if (roleParam && ['patient', 'doctor', 'hospital'].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;

      if (isLogin) {
        response = await authAPI.login(email, password, role);
      } else {
        if (!name.trim()) {
          throw new Error('Name is required for registration');
        }
        response = await authAPI.register({ email, password, role, name });
      }

      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      localStorage.setItem('userRole', response.user.role);

      // Navigate to appropriate dashboard
      switch (response.user.role) {
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
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-Inter">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <div className="flex gap-[6px] items-center shrink-0 flex-nowrap relative mb-6">
            <div className="flex w-[40px] h-[40px] items-center justify-center shrink-0 flex-nowrap relative rounded-[8px]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="h-6 w-6 fill-white"
              >
                <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
              </svg>
            </div>
            <span className="font-Inter text-[28px] font-semibold leading-[30.8px] text-[#0a0b10] tracking-[-1.1px] whitespace-nowrap">
              Scanlytics
            </span>
          </div>

          <h2 className="text-[32px] font-semibold text-[#151621] tracking-[-1.6px] leading-[1.2]">
            {isLogin ? 'Welcome back' : 'Get started'}
          </h2>
          <p className="mt-2 text-[16px] text-[#7a7a7a] tracking-[-0.32px]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-semibold text-[#1B44FE] hover:text-[#1534c0] transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] rounded-[20px] sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#0a0b10]">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-[12px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent sm:text-sm transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[#0a0b10]">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'patient' | 'doctor' | 'hospital')}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent sm:text-sm transition-all bg-white"
                >
                  <option value="patient">👤 Patient</option>
                  <option value="doctor">👨‍⚕️ Doctor</option>
                  <option value="hospital">🏥 Hospital Staff</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0a0b10]">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-[12px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent sm:text-sm transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0a0b10]">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-[12px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent sm:text-sm transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-[12px] shadow-[0_4px_4px_0_rgba(27,68,254,0.3)] text-sm font-semibold text-white hover:shadow-[0_6px_8px_0_rgba(27,68,254,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B44FE] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create Account')}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 font-medium">Quick Demo Access</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    setEmail('patient@demo.com');
                    setPassword('demo123');
                    setRole('patient');
                  }}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 rounded-[12px] shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  👤 Demo Patient Login
                </button>
                <button
                  onClick={() => {
                    setEmail('doctor@demo.com');
                    setPassword('demo123');
                    setRole('doctor');
                  }}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 rounded-[12px] shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  👨‍⚕️ Demo Doctor Login
                </button>
                <button
                  onClick={() => {
                    setEmail('hospital@demo.com');
                    setPassword('demo123');
                    setRole('hospital');
                  }}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 rounded-[12px] shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  🏥 Demo Hospital Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
