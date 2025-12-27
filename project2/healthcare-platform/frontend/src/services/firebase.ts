// Your actual Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDhheOLEZF9bdHPyJl0At8p670irpL_dUY",
  authDomain: "scanlytics-e644a.firebaseapp.com",
  projectId: "scanlytics-e644a",
  storageBucket: "scanlytics-e644a.firebasestorage.app",
  messagingSenderId: "648311850691",
  appId: "1:648311850691:web:f76a3d40f6a8de101c8476",
  measurementId: "G-G0P602R0MV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Check if we're in demo mode (for presentation page)
const isDemoMode = window.location.pathname.includes('/presentation');

// Enhanced feedback service with real Firebase
export const feedbackService = {
  async submitFeedback(feedbackData: any): Promise<string> {
    console.log('📝 Submitting feedback to Firebase:', feedbackData);
    
    if (isDemoMode) {
      // Demo mode for presentation page only
      console.log('🔧 Demo Mode: Local feedback storage for presentation');
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockDocId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log('✅ Demo feedback stored locally with ID:', mockDocId);
          
          try {
            const existingFeedback = JSON.parse(localStorage.getItem('scanlytics_feedback') || '[]');
            existingFeedback.push({
              ...feedbackData,
              id: mockDocId,
              submittedAt: new Date().toISOString(),
              mode: 'demo'
            });
            localStorage.setItem('scanlytics_feedback', JSON.stringify(existingFeedback));
          } catch (error) {
            console.warn('LocalStorage save failed:', error);
          }
          
          resolve(mockDocId);
        }, 1500);
      });
    } else {
      // Real Firebase submission for home page and other pages
      try {
        console.log('🔥 Submitting to real Firebase...');
        const docRef = await addDoc(collection(db, 'feedback'), {
          ...feedbackData,
          timestamp: serverTimestamp(),
          source: window.location.pathname,
          userAgent: navigator.userAgent,
          submittedAt: new Date().toISOString()
        });
        console.log('✅ Feedback submitted to Firebase with ID:', docRef.id);
        return docRef.id;
      } catch (error) {
        console.error('❌ Error submitting feedback to Firebase:', error);
        throw error;
      }
    }
  },

  // Get stored feedback (demo mode only)
  getStoredFeedback(): any[] {
    if (isDemoMode) {
      try {
        return JSON.parse(localStorage.getItem('scanlytics_feedback') || '[]');
      } catch (error) {
        console.warn('Failed to retrieve stored feedback:', error);
        return [];
      }
    }
    return [];
  },

  // Clear demo feedback
  clearDemoFeedback(): void {
    if (isDemoMode) {
      try {
        localStorage.removeItem('scanlytics_feedback');
        console.log('🗑️ Demo feedback cleared');
      } catch (error) {
        console.warn('Failed to clear demo feedback:', error);
      }
    }
  }
};

// Export Firebase instances and demo mode status
export { db, analytics, isDemoMode };

// Analytics service
export const analyticsService = {
  trackEvent(eventName: string, properties: any = {}): void {
    const timestamp = new Date().toISOString();
    console.log(`📊 Analytics Event:`, eventName, properties);
    
    if (isDemoMode) {
      try {
        const existingEvents = JSON.parse(localStorage.getItem('scanlytics_analytics') || '[]');
        existingEvents.push({
          event: eventName,
          properties,
          timestamp,
          sessionId: `demo_session_${Date.now()}`,
          mode: 'demo'
        });
        
        if (existingEvents.length > 100) {
          existingEvents.splice(0, existingEvents.length - 100);
        }
        
        localStorage.setItem('scanlytics_analytics', JSON.stringify(existingEvents));
      } catch (error) {
        console.warn('Analytics storage failed:', error);
      }
    }
    // In production, send to Google Analytics
  }
};

// Environment info service
export const environmentService = {
  getInfo() {
    return {
      isDemoMode,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
  }
};
