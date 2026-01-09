import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import InteractiveDoctors from './InteractiveDoctors';

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
        console.log('🔐 Attempting login:', { email, role, passwordLength: password.length });
        response = await authAPI.login(email, password, role);
      } else {
        if (!name.trim()) {
          throw new Error('Name is required for registration');
        }
        response = await authAPI.register({ email, password, role, name });
      }

      // Tokens are already stored by authAPI.login
      const user = response.data?.user || response.user;

      if (!user) {
        console.error('❌ No user data in response:', response);
        throw new Error('Login failed: No user data received from server');
      }

      console.log('✅ Login successful for:', user.email);

      // Navigate to appropriate dashboard
      switch (user.role) {
        case 'patient':
          navigate('/patient-dashboard');
          break;
        case 'doctor':
          navigate('/doctor-dashboard');
          break;
        case 'hospital':
          // Hospital dashboard not available - redirect to home
          navigate('/');
          break;
        default:
          navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      // Better error messages
      let errorMessage = 'Authentication failed';
      if (error.message) {
        errorMessage = error.message;
        // Check for specific error codes
        if (error.message.includes('User not found')) {
          errorMessage = 'Email not found. Please check your email or register a new account.';
        } else if (error.message.includes('Incorrect password')) {
          errorMessage = 'Incorrect password. Please try again or reset your password.';
        } else if (error.message.includes('Role mismatch')) {
          errorMessage = 'Please select the correct role for this account.';
        } else if (error.message.includes('Database not connected')) {
          errorMessage = 'Server error: Database not connected. Please try again later.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex text-left font-sans">
      {/* Left Side - Dark Premium Sidebar */}
      <div className="hidden lg:flex w-[45%] bg-[#0F172A] relative flex-col items-center justify-center p-16 overflow-hidden">
        {/* Background Pattern - Abstract & Medical */}
        <div className="absolute inset-0 z-0 opacity-10" style={{
          backgroundImage: `radial-gradient(#475569 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000"></div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
          {/* Header Text */}
          <div className="mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Healthcare</span>
              <br /> Simplified.
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-md mx-auto">
              Manage appointments, patients, and clinics with a modern, intuitive platform.
            </p>
          </div>

          {/* Animation Container */}
          <div className="w-full aspect-square max-w-[400px]">
            <InteractiveDoctors
              isPasswordFocused={isPasswordFocused}
              isEmailFocused={isEmailFocused}
            />
          </div>

          {/* Footer Text */}
          <div className="mt-12 text-slate-500 text-sm font-medium">
            Trusted by 10,000+ Doctors worldwide
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="relative w-full max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6 group">
              <div className="flex items-center gap-3">
                <img
                  src="/imgs/Gemini_Generated_Image_lv0l8xlv0l8xlv0l.png"
                  alt="HealthLink Logo"
                  className="w-14 h-14 rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-4xl font-bold text-gray-900 tracking-tight">
                  Health<span className="text-orange-600">Link</span>
                </span>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-3 text-base text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="font-bold text-orange-600 hover:text-orange-500 transition-colors"
                type="button"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl py-10 px-8 shadow-2xl rounded-[2rem] border border-white/50 ring-1 ring-gray-900/5">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="role" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'patient' | 'doctor' | 'hospital')}
                    className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium appearance-none"
                  >
                    <option value="patient">👤 Patient</option>
                    <option value="doctor">👨‍⚕️ Doctor</option>
                    <option value="hospital">🏥 Hospital Staff</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-500/20 text-white font-bold bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-0.5'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </div>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
