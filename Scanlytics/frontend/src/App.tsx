import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './components/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import Presentation from './pages/Presentation';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
          <Route path="/presentation" element={<Presentation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
