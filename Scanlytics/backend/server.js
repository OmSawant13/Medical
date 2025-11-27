const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body || '');
  next();
});

// Health check endpoints (both versions)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!', timestamp: new Date() });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'Backend v1 is running!', timestamp: new Date() });
});

// Auth endpoints - BOTH versions to catch all calls
app.post('/api/auth/login', handleLogin);
app.post('/api/v1/auth/login', handleLogin);

function handleLogin(req, res) {
  const { email, password, role } = req.body;
  
  console.log('🔐 Login attempt:', { email, password, role });
  
  // Demo credentials for all roles
  const demoUsers = {
    'patient@demo.com': {
      id: 'user1',
      name: 'Demo Patient',
      email: 'patient@demo.com',
      role: 'patient',
      roleSpecificId: 'P001',
      phone: '+1-555-0001'
    },
    'doctor@demo.com': {
      id: 'user2', 
      name: 'Dr. Demo Doctor',
      email: 'doctor@demo.com',
      role: 'doctor',
      roleSpecificId: 'D001',
      specialization: 'General Practice'
    },
    'hospital@demo.com': {
      id: 'user3',
      name: 'Demo Hospital',
      email: 'hospital@demo.com', 
      role: 'hospital',
      roleSpecificId: 'H001',
      hospitalName: 'Demo Hospital'
    }
  };
  
  const user = demoUsers[email];
  
  if (user && password === 'demo123') {
    console.log('✅ Login successful for:', email);
    res.json({
      message: 'Login successful',
      token: `demo-token-${user.id}`,
      user: user
    });
  } else {
    console.log('❌ Login failed for:', email);
    res.status(400).json({ message: 'Invalid credentials' });
  }
}

// Patient API endpoints
app.get('/api/patient/profile', (req, res) => {
  res.json({
    id: 'user1',
    name: 'Demo Patient',
    email: 'patient@demo.com',
    role: 'patient',
    roleSpecificId: 'P001'
  });
});

app.get('/api/patient/appointments', (req, res) => {
  res.json([]);
});

app.get('/api/patient/scans', (req, res) => {
  res.json([]);
});

app.get('/api/patient/notifications', (req, res) => {
  res.json([]);
});

app.post('/api/patient/appointments', (req, res) => {
  const appointment = {
    _id: `A${Date.now()}`,
    ...req.body,
    status: 'scheduled',
    qrCode: JSON.stringify({
      type: 'HEALTHCARE_APPOINTMENT',
      appointmentId: `A${Date.now()}`,
      patientId: 'P001',
      ...req.body
    })
  };
  
  console.log('📅 New appointment booked:', appointment);
  res.json(appointment);
});

// Catch all other requests
app.use('*', (req, res) => {
  console.log('❓ Unmatched route:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login', 
      'POST /api/v1/auth/login',
      'GET /api/patient/profile'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Healthcare Backend running on port ${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`🔐 Login v1: http://localhost:${PORT}/api/v1/auth/login`);
  console.log('📋 Demo credentials:');
  console.log('   patient@demo.com / demo123');
  console.log('   doctor@demo.com / demo123');
  console.log('   hospital@demo.com / demo123');
});
