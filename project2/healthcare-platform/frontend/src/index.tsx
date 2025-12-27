import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

console.log('Starting React app...'); // Debug log

// Global error handler for uncaught errors (like script errors from external libraries)
window.addEventListener('error', (event) => {
  // Suppress generic "Script error" messages that come from external scripts
  if (event.message === 'Script error.' || event.message === '') {
    console.warn('External script error suppressed:', event.filename);
    event.preventDefault(); // Prevent default error handling
    return false;
  }
  // Log other errors but don't crash the app
  console.error('Global error:', event.error || event.message);
  return true;
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Prevent default browser error handling
  event.preventDefault();
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
