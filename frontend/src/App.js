import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import PatientHistory from './pages/patient/History';
import PatientSettings from './pages/patient/Settings';
import PatientNotifications from './pages/patient/Notifications';
import NearbyHospitals from './pages/patient/NearbyHospitals';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorPatientView from './pages/doctor/PatientView';
import LongTermPatients from './pages/doctor/LongTermPatients';

// Hospital Pages
import HospitalDashboard from './pages/hospital/Dashboard';

// Layout
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Patient Routes */}
          <Route path="/patient" element={<PrivateRoute><Layout role="patient" /></PrivateRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="history" element={<PatientHistory />} />
            <Route path="notifications" element={<PatientNotifications />} />
            <Route path="settings" element={<PatientSettings />} />
            <Route path="nearby-hospitals" element={<NearbyHospitals />} />
          </Route>

          {/* Doctor Routes */}
          <Route path="/doctor" element={<PrivateRoute><Layout role="doctor" /></PrivateRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="patient/:patientId" element={<DoctorPatientView />} />
            <Route path="long-term-patients" element={<LongTermPatients />} />
          </Route>

          {/* Hospital Routes */}
          <Route path="/hospital" element={<PrivateRoute><Layout role="hospital" /></PrivateRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HospitalDashboard />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;

