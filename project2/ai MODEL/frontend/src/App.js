import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

function App() {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '👋 Hello! I\'m your medical diagnosis assistant. Please describe your symptoms and I\'ll help provide possible diagnostic suggestions.\n\n⚠️ IMPORTANT DISCLAIMER: This bot provides informational suggestions only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      type: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: userMessage.text
      });

      if (response.data.success) {
        const botMessage = {
          type: 'bot',
          text: response.data.response,
          possibleConditions: response.data.possible_conditions || [],
          detectedSymptoms: response.data.detected_symptoms || [],
          urgency: response.data.urgency || 'monitor',
          recommendations: response.data.recommendations || [],
          confidenceScores: response.data.confidence_scores || {},
          treatments: response.data.treatments || {},
          timestamp: response.data.timestamp
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (error) {
      let errorText = 'Unable to process your request. Please try again.';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorText = `❌ Connection Failed!\n\n🔧 The backend server is not running.\n\nPlease start the backend server:\n1. Open a terminal\n2. Navigate to the backend folder\n3. Run: python app.py\n\nOr use the startup script: ./start.sh\n\nThe backend should run on http://localhost:8001`;
      } else if (error.response) {
        errorText = `❌ Server Error: ${error.response.data.error || error.response.statusText}`;
      } else {
        errorText = `❌ Error: ${error.message || 'Unable to process your request. Please try again.'}`;
      }
      
      const errorMessage = {
        type: 'bot',
        text: errorText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'emergency':
        return '#ff4444';
      case 'consult_doctor':
        return '#ff8800';
      default:
        return '#4CAF50';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'emergency':
        return '🚨 EMERGENCY';
      case 'consult_doctor':
        return '⚠️ CONSULT DOCTOR';
      default:
        return '✅ MONITOR';
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>🏥 Medical Diagnosis Assistant</h1>
          <p className="disclaimer">For informational purposes only - Not a substitute for professional medical advice</p>
        </div>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                
                {message.type === 'bot' && message.possibleConditions && message.possibleConditions.length > 0 && (
                  <div className="diagnosis-details">
                    {message.urgency && (
                      <div 
                        className="urgency-badge"
                        style={{ backgroundColor: getUrgencyColor(message.urgency) }}
                      >
                        {getUrgencyLabel(message.urgency)}
                      </div>
                    )}
                    
                    {message.detectedSymptoms && message.detectedSymptoms.length > 0 && (
                      <div className="symptoms-detected">
                        <strong>Detected Symptoms:</strong> {message.detectedSymptoms.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
                      </div>
                    )}

                    {message.confidenceScores && Object.keys(message.confidenceScores).length > 0 && (
                      <div className="confidence-scores">
                        <strong>Confidence Rankings:</strong>
                        <div className="confidence-list">
                          {Object.entries(message.confidenceScores)
                            .sort((a, b) => b[1] - a[1])
                            .map(([condition, score]) => (
                              <div key={condition} className="confidence-item">
                                <span className="condition-name">{condition}</span>
                                <span className="confidence-bar-container">
                                  <span 
                                    className="confidence-bar" 
                                    style={{ 
                                      width: `${score}%`,
                                      backgroundColor: score >= 70 ? '#4CAF50' : score >= 50 ? '#ff9800' : '#ff5722'
                                    }}
                                  ></span>
                                  <span className="confidence-percent">{score}%</span>
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {message.treatments && Object.keys(message.treatments).length > 0 && (
                      <div className="treatments-section">
                        <strong>💊 Treatment Solutions:</strong>
                        {Object.entries(message.treatments).map(([condition, treatmentData]) => (
                          <div key={condition} className="treatment-item">
                            <div className="treatment-header">
                              <strong>{condition}</strong>
                              {treatmentData.duration && (
                                <span className="treatment-duration">⏱️ {treatmentData.duration}</span>
                              )}
                            </div>
                            {treatmentData.treatments && treatmentData.treatments.length > 0 && (
                              <ul className="treatment-list">
                                {treatmentData.treatments.map((treatment, idx) => (
                                  <li key={idx}>{treatment}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="recommendations">
                        <strong>📋 Next Steps:</strong>
                        <ul>
                          {message.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form className="input-form" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms here... (e.g., 'I have a fever and headache')"
            disabled={loading}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="send-button"
          >
            {loading ? '⏳' : '📤'}
          </button>
        </form>
      </div>

      <div className="footer-disclaimer">
        <p>
          <strong>⚠️ Medical Disclaimer:</strong> This application is for informational and educational purposes only. 
          It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. 
          Always seek the advice of your physician or other qualified health provider with any questions you may have 
          regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of 
          something you have read or received from this application. In case of a medical emergency, call your local 
          emergency services immediately.
        </p>
      </div>
    </div>
  );
}

export default App;

