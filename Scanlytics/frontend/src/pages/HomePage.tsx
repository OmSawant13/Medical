import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { feedbackService } from '../services/firebase';

const HomePage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    rating: 5,
    feedback: '',
    category: 'general'
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackForm.name || !feedbackForm.email || !feedbackForm.feedback) {
      setSubmitError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      console.log('🚀 Submitting feedback from home page...');
      const docId = await feedbackService.submitFeedback({
        ...feedbackForm,
        source: 'home_page',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Home page feedback submitted successfully! ID:', docId);
      setFeedbackSubmitted(true);
      
      setTimeout(() => {
        setFeedbackSubmitted(false);
        setFeedbackForm({ name: '', email: '', rating: 5, feedback: '', category: 'general' });
      }, 4000);
    } catch (error) {
      console.error('❌ Error submitting home page feedback:', error);
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                🔬 Scanlytics
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('developer')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Developer
              </button>
              <Link 
                to="/presentation"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Presentation
              </Link>
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                >
                  About
                </button>
                <button 
                  onClick={() => scrollToSection('developer')}
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                >
                  Developer
                </button>
                <Link 
                  to="/presentation"
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Presentation
                </Link>
                <Link 
                  to="/login" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 text-center"
                >
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Revolutionary AI-Powered
              <span className="text-blue-600"> Medical Analytics</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Scanlytics transforms healthcare with cutting-edge AI analysis, real-time medical scan processing, 
              and comprehensive patient management. Experience the future of medical diagnostics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/login?role=patient"
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
              >
                👤 Patient Portal
              </Link>
              <Link
                to="/login?role=doctor"
                className="bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-200 flex items-center justify-center"
              >
                👨‍⚕️ Doctor Portal
              </Link>
              <Link
                to="/login?role=hospital"
                className="bg-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition duration-200 flex items-center justify-center"
              >
                🏥 Hospital Portal
              </Link>
              <Link
                to="/presentation"
                className="bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition duration-200 flex items-center justify-center"
              >
                🎯 View Presentation
              </Link>
            </div>

            {/* Live Demo Preview */}
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 sm:p-6 mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">🚀 Live Platform Preview</h3>
                <p className="text-blue-100">Experience real-time AI medical analysis in action</p>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl sm:text-4xl mb-2">⚡</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">2.3s</div>
                  <div className="text-sm text-gray-600">Avg Scan Analysis</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl sm:text-4xl mb-2">🎯</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">96.8%</div>
                  <div className="text-sm text-gray-600">AI Accuracy Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl sm:text-4xl mb-2">👥</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">50K+</div>
                  <div className="text-sm text-gray-600">Patients Served</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-36 sm:w-72 h-36 sm:h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 sm:w-80 h-40 sm:h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Advanced AI-Powered Features</h2>
            <p className="text-lg sm:text-xl text-gray-600">Revolutionary technology for modern healthcare</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Patient Features */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 sm:p-8 rounded-2xl transform hover:scale-105 transition-transform">
              <div className="text-3xl sm:text-4xl mb-4">👤</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Smart Patient Portal</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  QR-code enabled appointments
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Real-time AI scan analysis
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Instant health notifications
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Comprehensive health reports
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Secure data management
                </li>
              </ul>
            </div>

            {/* Doctor Features */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 sm:p-8 rounded-2xl transform hover:scale-105 transition-transform">
              <div className="text-3xl sm:text-4xl mb-4">👨‍⚕️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Professional Suite</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  AI-assisted diagnostics
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Priority patient queue
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Comprehensive patient records
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Performance analytics
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Automated reporting
                </li>
              </ul>
            </div>

            {/* Hospital Features */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 sm:p-8 rounded-2xl transform hover:scale-105 transition-transform sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl mb-4">🏥</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Enterprise Management</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Bulk scan processing
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  System-wide analytics
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Multi-department integration
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Real-time monitoring
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Comprehensive reporting
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Technology Showcase */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Next-Generation AI Technology</h2>
            <p className="text-lg sm:text-xl opacity-90">Powered by cutting-edge machine learning algorithms</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6">🤖 Advanced Neural Networks</h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-3">⭐</span>
                  96.8% accuracy in medical imaging
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-3">⭐</span>
                  Sub-second scan processing
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-3">⭐</span>
                  Continuous learning & adaptation
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-3">⭐</span>
                  Multi-modal analysis support
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-3">⭐</span>
                  Doctor-verified validation
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
              <div className="text-center">
                <div className="text-4xl sm:text-6xl mb-4">🧠</div>
                <h4 className="text-xl sm:text-2xl font-bold mb-4">Deep Learning Engine</h4>
                <p className="text-base sm:text-lg opacity-90 mb-6">
                  Our proprietary AI models are trained on millions of medical images and validated 
                  by healthcare professionals worldwide.
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-xl sm:text-2xl font-bold">50M+</div>
                    <div className="text-xs sm:text-sm">Images Processed</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-xl sm:text-2xl font-bold">2.3s</div>
                    <div className="text-xs sm:text-sm">Avg Analysis Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About Scanlytics</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Revolutionizing healthcare through artificial intelligence and innovative technology solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                Scanlytics is dedicated to transforming healthcare delivery through cutting-edge AI technology. 
                We empower healthcare professionals with intelligent tools that enhance diagnostic accuracy, 
                streamline patient care, and improve health outcomes worldwide.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-blue-600 text-xl mr-3 mt-1">��</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Precision Medicine</h4>
                    <p className="text-gray-600 text-sm">AI-driven insights for personalized healthcare</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-green-600 text-xl mr-3 mt-1">🚀</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Innovation Focus</h4>
                    <p className="text-gray-600 text-sm">Continuous advancement in medical AI technology</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-purple-600 text-xl mr-3 mt-1">🤝</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Collaborative Care</h4>
                    <p className="text-gray-600 text-sm">Connecting patients, doctors, and healthcare systems</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Platform Impact</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Global Healthcare Providers</span>
                  <div className="flex items-center">
                    <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-blue-600 h-2 rounded-full w-4/5"></div>
                    </div>
                    <span className="text-blue-600 font-semibold">500+</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Patients Served</span>
                  <div className="flex items-center">
                    <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-green-600 h-2 rounded-full w-full"></div>
                    </div>
                    <span className="text-green-600 font-semibold">50K+</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Scans Analyzed</span>
                  <div className="flex items-center">
                    <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-purple-600 h-2 rounded-full w-5/6"></div>
                    </div>
                    <span className="text-purple-600 font-semibold">100K+</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">AI Accuracy Rate</span>
                  <div className="flex items-center">
                    <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '96.8%' }}></div>
                    </div>
                    <span className="text-red-600 font-semibold">96.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developer" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Meet the Developer</h2>
            <p className="text-lg sm:text-xl text-gray-600">Passionate about healthcare innovation and AI technology</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 sm:p-12">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="text-center md:text-left">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 rounded-full flex items-center justify-center text-4xl sm:text-6xl mx-auto md:mx-0 mb-4">
                    👨‍💻
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Vijay Kota</h3>
                  <p className="text-blue-100 mb-4">Full-Stack Developer & AI Enthusiast</p>
                  <div className="flex justify-center md:justify-start space-x-4">
                    <a href="https://linkedin.com/in/vijaykota" className="text-white hover:text-blue-200 transition-colors">
                      �� LinkedIn
                    </a>
                    <a href="https://github.com/vijaykota" className="text-white hover:text-blue-200 transition-colors">
                      🐙 GitHub
                    </a>
                    <a href="mailto:vijay@scanlytics.com" className="text-white hover:text-blue-200 transition-colors">
                      📧 Email
                    </a>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-lg sm:text-xl font-bold mb-4">About the Project</h4>
                  <p className="text-blue-100 mb-6 leading-relaxed text-sm sm:text-base">
                    Scanlytics represents the culmination of extensive research in medical AI and healthcare technology. 
                    Built with modern web technologies including React, Node.js, MongoDB, and advanced machine learning models, 
                    this platform aims to bridge the gap between cutting-edge AI and practical healthcare applications.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">🛠️ Tech Stack</h5>
                      <ul className="text-blue-100 text-sm space-y-1">
                        <li>• React & TypeScript</li>
                        <li>• Node.js & Express</li>
                        <li>• MongoDB & Mongoose</li>
                        <li>• Firebase & Analytics</li>
                      </ul>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">⚡ Key Features</h5>
                      <ul className="text-blue-100 text-sm space-y-1">
                        <li>• Real-time AI Analysis</li>
                        <li>• QR Code Integration</li>
                        <li>• Mobile Responsive</li>
                        <li>• Secure Authentication</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">We Value Your Feedback</h2>
            <p className="text-lg sm:text-xl opacity-90">Help us improve Scanlytics with your valuable insights</p>
          </div>

          {feedbackSubmitted ? (
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-4xl sm:text-6xl mb-4">🙏</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Thank You for Your Feedback!</h3>
              <p className="text-blue-100 mb-4">Your input has been submitted to Firebase successfully!</p>
              <p className="text-blue-100">Your feedback helps us build a better healthcare platform for everyone.</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
              {submitError && (
                <div className="bg-red-500/20 border border-red-400 rounded-lg p-4 mb-6">
                  <p className="text-red-100">⚠️ {submitError}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Name *</label>
                  <input
                    type="text"
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Category</label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="general" className="text-gray-900">General Feedback</option>
                    <option value="feature" className="text-gray-900">Feature Request</option>
                    <option value="bug" className="text-gray-900">Bug Report</option>
                    <option value="ui" className="text-gray-900">UI/UX Feedback</option>
                    <option value="performance" className="text-gray-900">Performance Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Rating</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                        className={`text-2xl ${star <= feedbackForm.rating ? 'text-yellow-400' : 'text-white/30'} hover:text-yellow-400 transition-colors`}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="text-white ml-2">({feedbackForm.rating}/5)</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Your Feedback *</label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 h-32 resize-none"
                  placeholder="Share your thoughts, suggestions, or report any issues you've encountered..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-blue-600 font-bold py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent inline-block mr-2"></div>
                    Submitting to Firebase...
                  </>
                ) : (
                  '🚀 Submit Feedback'
                )}
              </button>
              <p className="text-center text-blue-100 text-sm mt-3">
                💾 Feedback will be stored securely in Firebase
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Trusted Worldwide</h2>
            <p className="text-lg sm:text-xl text-gray-600">Join thousands of healthcare professionals using Scanlytics</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-sm sm:text-base text-gray-700 font-semibold">Patients Served</div>
              <div className="text-xs sm:text-sm text-gray-500">Across 50+ Countries</div>
            </div>
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-sm sm:text-base text-gray-700 font-semibold">Healthcare Providers</div>
              <div className="text-xs sm:text-sm text-gray-500">Hospitals & Clinics</div>
            </div>
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">100K+</div>
              <div className="text-sm sm:text-base text-gray-700 font-semibold">Scans Analyzed</div>
              <div className="text-xs sm:text-sm text-gray-500">AI-Powered Analysis</div>
            </div>
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl sm:text-4xl font-bold text-red-600 mb-2">96.8%</div>
              <div className="text-sm sm:text-base text-gray-700 font-semibold">Accuracy Rate</div>
              <div className="text-xs sm:text-sm text-gray-500">Validated Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Experience the Future of Healthcare?</h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Join thousands of healthcare professionals already using Scanlytics to improve patient outcomes and streamline medical workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition duration-200"
            >
              🚀 Get Started Now
            </Link>
            <Link
              to="/presentation"
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200"
            >
              🎯 View Presentation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl sm:text-2xl font-bold mb-4">🔬 Scanlytics</div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Revolutionary AI-powered medical analytics platform for the modern healthcare ecosystem.
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="https://linkedin.com/company/scanlytics" className="text-gray-300 hover:text-white">💼</a>
                <a href="https://twitter.com/scanlytics" className="text-gray-300 hover:text-white">🐦</a>
                <a href="https://github.com/scanlytics" className="text-gray-300 hover:text-white">🐙</a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/login?role=patient" className="hover:text-white">Patient Portal</Link></li>
                <li><Link to="/login?role=doctor" className="hover:text-white">Doctor Portal</Link></li>
                <li><Link to="/login?role=hospital" className="hover:text-white">Hospital Portal</Link></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white">About Us</button></li>
                <li><button onClick={() => scrollToSection('developer')} className="hover:text-white">Developer</button></li>
                <li><Link to="/presentation" className="hover:text-white">Presentation</Link></li>
                <li><a href="#privacy" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>📧 meet_me@gmail.com</li>
                <li>📞 meet-me</li>
                <li>📍 secret</li>
                <li>🌐 https://scanlytics-e644a.web.app/</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p className="text-sm">
              &copy; 2025 Scanlytics. All rights reserved. | 
              <span className="ml-1">Built with ❤️ for better healthcare</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
