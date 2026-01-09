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
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Doctor ID <span className="text-gray-400 font-normal normal-case">(Optional - generated automatically)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                placeholder="Enter ID or leave blank"
              />
            </div>
          </div>
        );
      case 'hospital':
        return (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Hospital ID <span className="text-gray-400 font-normal normal-case">(Optional - generated automatically)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="hospitalId"
                value={formData.hospitalId}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                placeholder="Enter ID or leave blank"
              />
            </div>
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Patient ID <span className="text-gray-400 font-normal normal-case">(Optional - for existing users)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                placeholder="Leave blank for new account"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-white">
      {/* Aurora Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[50%] -left-[20%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-100/40 via-white to-white blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-gray-200/20 to-orange-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-tr from-orange-200/20 to-gray-200/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 hidden sm:block"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex justify-center mb-8 group">
          <div className="flex items-center gap-2">
            <img
              src="/imgs/Gemini_Generated_Image_lv0l8xlv0l8xlv0l.png"
              alt="HealthLink Logo"
              className="w-10 h-10 rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Health<span className="text-orange-600">Link</span>
            </span>
          </div>
        </Link>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your {role} portal
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[450px] relative z-10">
        <div className="bg-white/80 backdrop-blur-2xl py-10 px-8 shadow-2xl rounded-[2rem] border border-white/50 ring-1 ring-gray-900/5">
          {/* Demo Credentials - Styled Subtly */}
          <div className="mb-8 p-4 bg-orange-50/50 rounded-xl border border-orange-100/50 text-center">
            <p className="text-xs font-medium text-orange-800 uppercase tracking-widest mb-1">Demo Access</p>
            <p className="text-sm text-gray-600 font-medium">admin@test.com  •  password</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-red-600 text-sm font-medium">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {getRoleSpecificFields()}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium appearance-none"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="hospital">Hospital</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 transition-colors" />
                <span className="ml-2 text-sm text-gray-500 font-medium">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                Forgot password?
              </a>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-500/20 text-white font-bold bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-0.5'
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  `Sign In`
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200/60" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 backdrop-blur-xl text-gray-400 font-medium">New to HealthLink?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-3.5 px-4 border border-gray-200 rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 font-bold transition-all duration-200"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
