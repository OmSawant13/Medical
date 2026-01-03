import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPageV2 from './pages/LandingPageV2';
import Login from './components/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Presentation from './pages/Presentation';
import FindHospitals from './pages/FindHospitals';
import HospitalDoctors from './pages/HospitalDoctors';
import DoctorDetail from './pages/DoctorDetail';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPageV2 />} />
          {/* Keep previous home page available so nothing is lost and revert is easy */}
          <Route path="/home-old" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/presentation" element={<Presentation />} />
          <Route path="/find-hospitals" element={<FindHospitals />} />
          <Route path="/hospitals/:hospitalId/doctors" element={<HospitalDoctors />} />
          <Route path="/doctors/:doctorId" element={<DoctorDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
