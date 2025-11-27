import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedbackService, isDemoMode, analyticsService } from '../services/firebase';
import EnvironmentBanner from '../components/EnvironmentBanner';
import { BusinessCharts } from '../components/BusinessCharts';
import { dsaImplementations } from '../data/dsaImplementations';
import { databaseImplementations } from '../data/databaseImplementations';
import './Presentation.css';

const Presentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCode, setSelectedCode] = useState<keyof typeof dsaImplementations>('binarySearch');
  const [selectedDatabase, setSelectedDatabase] = useState('mongodb');
  const [codeOutput, setCodeOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    experience: '',
    rating: 5,
    feedback: '',
    category: 'general',
    technicalLevel: '',
    improvements: '',
    recommendation: '',
    contactPermission: false
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    analyticsService.trackEvent('presentation_page_view', {
      tab: activeTab,
      isDemoMode,
      timestamp: new Date().toISOString()
    });
  }, [activeTab]);

  const runCode = () => {
    if (!dsaImplementations[selectedCode]) return;
    
    setIsRunning(true);
    setCodeOutput('⏳ Compiling and executing C++ code...');
    
    analyticsService.trackEvent('cpp_code_execution', {
      algorithm: selectedCode,
      timestamp: new Date().toISOString()
    });
    
    setTimeout(() => {
      try {
        const output = dsaImplementations[selectedCode].execute();
        setCodeOutput(output);
        
        analyticsService.trackEvent('cpp_execution_success', {
          algorithm: selectedCode,
          outputLength: output.length
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setCodeOutput(`❌ Error executing code: ${errorMessage}`);
        
        analyticsService.trackEvent('cpp_execution_error', {
          algorithm: selectedCode,
          error: errorMessage
        });
      } finally {
        setIsRunning(false);
      }
    }, 2000);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const docId = await feedbackService.submitFeedback({
        ...feedbackForm,
        source: 'presentation_page',
        timestamp: new Date().toISOString()
      });
      
      setFeedbackSubmitted(true);
      
      analyticsService.trackEvent('feedback_submit_success', {
        category: feedbackForm.category,
        rating: feedbackForm.rating,
        docId
      });
      
      setTimeout(() => {
        setFeedbackSubmitted(false);
        setFeedbackForm({
          name: '',
          email: '',
          organization: '',
          role: '',
          experience: '',
          rating: 5,
          feedback: '',
          category: 'general',
          technicalLevel: '',
          improvements: '',
          recommendation: '',
          contactPermission: false
        });
      }, 4000);
    } catch (error) {
      setSubmitError('Failed to submit feedback. Please try again.');
      analyticsService.trackEvent('feedback_submit_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl sm:text-3xl font-bold text-blue-600">
              🔬 Scanlytics
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
                ← Back to Home
              </Link>
              {isDemoMode && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                  🔧 Demo Mode
                </div>
              )}
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            🎯 Scanlytics Technical Presentation
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Complete C++ DSA implementations, MongoDB/Firebase integration, interactive business analytics, 
            and comprehensive technical demonstrations with real-world healthcare applications
          </p>
        </div>

        {/* Environment Banner */}
        <EnvironmentBanner />

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex flex-wrap justify-center space-x-1 bg-white rounded-lg p-1 shadow-lg">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'dsa', label: 'C++ DSA', icon: '🧮' },
              { id: 'database', label: 'Database', icon: '🍃' },
              { id: 'business', label: 'Business Analytics', icon: '📊' },
              { id: 'feedback', label: 'Feedback', icon: '💬' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  analyticsService.trackEvent('tab_change', { tab: tab.id });
                }}
                className={`flex items-center px-4 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">🔬 Scanlytics Complete Technical Overview</h2>
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete Implementation Suite</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-600 mr-3 text-2xl">🧮</span>
                      <div>
                        <span className="font-medium">4 C++ DSA Algorithms</span>
                        <p className="text-sm text-gray-600">Binary Search, Priority Queue, Hash Map, Dynamic Programming</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-600 mr-3 text-2xl">🍃</span>
                      <div>
                        <span className="font-medium">MongoDB Integration</span>
                        <p className="text-sm text-gray-600">Aggregation pipelines, GridFS, Sharding, Change Streams</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-orange-600 mr-3 text-2xl">🔥</span>
                      <div>
                        <span className="font-medium">Firebase Real-time</span>
                        <p className="text-sm text-gray-600">Live listeners, Cloud Functions, FCM, Security Rules</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-600 mr-3 text-2xl">📊</span>
                      <div>
                        <span className="font-medium">Business Analytics</span>
                        <p className="text-sm text-gray-600">CAC, CLTV, NPS, Revenue Forecasting, Interactive Charts</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Platform Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Executable C++ code with real-time output simulation</li>
                    <li>• Complete time/space complexity analysis</li>
                    <li>• Real-world healthcare use cases (16+ examples)</li>
                    <li>• MongoDB aggregation pipeline demonstrations</li>
                    <li>• Firebase real-time synchronization examples</li>
                    <li>• Interactive business intelligence charts</li>
                    <li>• Comprehensive feedback system with Firebase</li>
                    <li>• {isDemoMode ? 'Demo mode with local storage' : 'Production Firebase integration'}</li>
                    <li>• Mobile-responsive modern interface</li>
                    <li>• Production-ready code implementations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* C++ DSA Tab */}
        {activeTab === 'dsa' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">🧮 Complete C++ DSA Implementations</h2>
              
              {/* Real-world Usage Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  🏥 Where We Use DSA in Scanlytics Healthcare Platform
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(dsaImplementations).map(([key, impl]) => (
                    <div key={key} className="bg-white rounded-lg p-4 shadow">
                      <h4 className="font-bold text-gray-900 mb-2">{impl.title}</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {impl.realWorldUse.map((use, idx) => (
                          <li key={idx}>{use}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* DSA Algorithm Selector */}
              <div className="flex flex-wrap gap-3 mb-8">
                {Object.entries(dsaImplementations).map(([key, impl]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCode(key as keyof typeof dsaImplementations);
                      setCodeOutput('');
                      analyticsService.trackEvent('algorithm_select', { algorithm: key });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCode === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {impl.title}
                  </button>
                ))}
              </div>

              {/* Selected Implementation */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {dsaImplementations[selectedCode].title}
                  </h3>
                  <p className="text-gray-700 text-lg mb-4">
                    {dsaImplementations[selectedCode].description}
                  </p>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">🏥 Real-world Applications:</h4>
                    <ul className="space-y-1 text-gray-700">
                      {dsaImplementations[selectedCode].realWorldUse.map((use, idx) => (
                        <li key={idx}>{use}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* C++ Code Display */}
                <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white text-lg font-semibold">C++ Source Code</h4>
                    <div className="flex space-x-3">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">C++</span>
                      <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
                      >
                        {isRunning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Compiling...</span>
                          </>
                        ) : (
                          <>
                            <span>▶️</span>
                            <span>Run Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <pre className="text-green-400 text-sm leading-relaxed overflow-x-auto">
                    <code>{dsaImplementations[selectedCode].code}</code>
                  </pre>
                </div>

                {/* Code Output */}
                {codeOutput && (
                  <div className="bg-black rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-green-400 text-lg font-semibold">🖥️ Program Output</span>
                      {isDemoMode && (
                        <span className="ml-3 text-yellow-400 text-sm">(Simulated Execution)</span>
                      )}
                    </div>
                    <pre className="text-green-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      {codeOutput}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">🍃 Database Management & Integration</h2>
              
              {/* Database Selector */}
              <div className="flex flex-wrap gap-3 mb-8">
                {Object.entries(databaseImplementations).map(([key, impl]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDatabase(key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedDatabase === key
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {impl.title}
                  </button>
                ))}
              </div>

              {/* Selected Database */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {databaseImplementations[selectedDatabase].title}
                  </h3>
                  <p className="text-gray-700 text-lg mb-4">
                    {databaseImplementations[selectedDatabase].description}
                  </p>
                  
                  {/* Real-world Usage */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 mb-2">🏥 Real-world Applications:</h4>
                    <ul className="space-y-1 text-gray-700">
                      {databaseImplementations[selectedDatabase].realWorldUse.map((use, idx) => (
                        <li key={idx}>{use}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Concepts */}
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">🔑 Key Concepts Implemented:</h4>
                    <ul className="space-y-1 text-gray-700">
                      {databaseImplementations[selectedDatabase].concepts.map((concept, idx) => (
                        <li key={idx}>• {concept}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Database Demo */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <h4 className="text-white text-lg font-semibold">💻 Live Demo & Implementation</h4>
                  </div>
                  <pre className="text-green-400 text-sm leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                    {databaseImplementations[selectedDatabase].demo}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Analytics Tab */}
        {activeTab === 'business' && (
          <BusinessCharts />
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">💬 Comprehensive Technical Feedback</h2>
              
              {feedbackSubmitted ? (
                <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-12">
                  <div className="text-6xl mb-6">🙏</div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h3>
                  <p className="text-xl text-gray-600 mb-4">
                    Your detailed feedback has been {isDemoMode ? 'stored locally (demo mode)' : 'submitted to Firebase'}!
                  </p>
                  <p className="text-gray-500">We appreciate your time and insights to improve Scanlytics.</p>
                  {isDemoMode && (
                    <div className="mt-4 text-sm text-blue-600">
                      🔧 Demo Mode: Check console for local storage details
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-8">
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center text-red-700">
                        <span className="text-lg mr-2">⚠️</span>
                        <span className="font-medium">{submitError}</span>
                      </div>
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">👤 Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={feedbackForm.name}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Email Address *</label>
                        <input
                          type="email"
                          value={feedbackForm.email}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Organization/Institution</label>
                        <input
                          type="text"
                          value={feedbackForm.organization}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, organization: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Company, University, Hospital, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Professional Role *</label>
                        <select
                          value={feedbackForm.role}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select your role</option>
                          <option value="student">Student</option>
                          <option value="developer">Software Developer</option>
                          <option value="data-scientist">Data Scientist</option>
                          <option value="doctor">Healthcare Professional</option>
                          <option value="researcher">Researcher</option>
                          <option value="manager">Technical Manager</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Technical Background */}
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-green-900 mb-4">🛠️ Technical Background</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Years of Experience *</label>
                        <select
                          value={feedbackForm.experience}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, experience: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select experience level</option>
                          <option value="0-1">0-1 years (Beginner)</option>
                          <option value="2-3">2-3 years (Junior)</option>
                          <option value="4-6">4-6 years (Mid-level)</option>
                          <option value="7-10">7-10 years (Senior)</option>
                          <option value="10+">10+ years (Expert)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Technical Level *</label>
                        <select
                          value={feedbackForm.technicalLevel}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, technicalLevel: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        >
                          <option value="">How technical are you?</option>
                          <option value="non-technical">Non-technical user</option>
                          <option value="basic">Basic technical knowledge</option>
                          <option value="intermediate">Intermediate programmer</option>
                          <option value="advanced">Advanced developer</option>
                          <option value="expert">Technical expert/architect</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-purple-900 mb-4">📝 Detailed Feedback</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Feedback Category *</label>
                          <select
                            value={feedbackForm.category}
                            onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          >
                            <option value="general">General Platform Feedback</option>
                            <option value="overall">Overall Presentation</option>
                            <option value="dsa">C++ DSA Implementation Quality</option>
                            <option value="mongodb">MongoDB/Database Performance</option>
                            <option value="firebase">Firebase Integration</option>
                            <option value="business">Business Analytics Accuracy</option>
                            <option value="ai">AI/ML Model Performance</option>
                            <option value="ui">User Interface Design</option>
                            <option value="performance">System Performance</option>
                            <option value="security">Security & Privacy</option>
                            <option value="documentation">Documentation Quality</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Overall Rating *</label>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                                className={`text-3xl ${star <= feedbackForm.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                              >
                                ⭐
                              </button>
                            ))}
                            <span className="text-gray-600 ml-3 font-medium">
                              {feedbackForm.rating}/5 ({['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedbackForm.rating - 1]})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Detailed Feedback *</label>
                        <textarea
                          value={feedbackForm.feedback}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent h-40 resize-none"
                          placeholder="Share your detailed thoughts about the C++ implementations, MongoDB/Firebase integration, business analytics, code quality, user experience, or any specific features. What impressed you? What could be improved?"
                          required
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          {feedbackForm.feedback.length}/1000 characters
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Suggestions for Improvement</label>
                        <textarea
                          value={feedbackForm.improvements}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, improvements: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none"
                          placeholder="What specific improvements would you suggest? Additional C++ algorithms? Better MongoDB queries? More business metrics? UI/UX enhancements?"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-orange-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-orange-900 mb-4">🤝 Recommendation</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Would you recommend Scanlytics? *</label>
                        <select
                          value={feedbackForm.recommendation}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, recommendation: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select recommendation level</option>
                          <option value="definitely">Definitely - Excellent platform!</option>
                          <option value="probably">Probably - Good overall experience</option>
                          <option value="maybe">Maybe - Has potential with improvements</option>
                          <option value="probably-not">Probably not - Needs significant work</option>
                          <option value="definitely-not">Definitely not - Major issues present</option>
                        </select>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="contactPermission"
                          checked={feedbackForm.contactPermission}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, contactPermission: e.target.checked }))}
                          className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="contactPermission" className="text-gray-700 text-sm">
                          I agree to be contacted for follow-up questions or updates about Scanlytics development. 
                          <span className="text-gray-500">(Optional - helps us understand user needs better)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-12 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg shadow-lg transform hover:scale-105 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                          {isDemoMode ? 'Submitting (Demo Mode)...' : 'Submitting to Firebase...'}
                        </>
                      ) : (
                        '🚀 Submit Comprehensive Feedback'
                      )}
                    </button>
                    <p className="text-sm text-gray-500 mt-3">
                      Your feedback is {isDemoMode ? 'stored locally in demo mode' : 'stored securely in Firebase'} and helps us improve the platform
                    </p>
                    {isDemoMode && (
                      <p className="text-xs text-blue-600 mt-2">
                        🔧 Demo Mode: No Firebase connections • Check browser console for local storage details
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Presentation;
