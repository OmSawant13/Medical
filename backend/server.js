const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

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

// Import route modules
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const hospitalRoutes = require('./routes/hospital');
const analyticsRoutes = require('./routes/analytics');
const searchRoutes = require('./routes/search');
const triageRoutes = require('./routes/triage');
const schedulingRoutes = require('./routes/scheduling');
const aiRoutes = require('./routes/ai');
const docsRoutes = require('./routes/docs');
const firebaseRoutes = require('./routes/firebase');

// Initialize Firebase
const { initializeFirebase } = require('./config/firebase');
initializeFirebase();

// API Routes - Core routes
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/hospital', hospitalRoutes);

// API Routes - New DSA and Analytics endpoints
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/firebase', firebaseRoutes);

// Catch all other requests
app.use('*', (req, res) => {
  console.log('❓ Unmatched route:', req.method, req.originalUrl);
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/v1/auth/login',
      'GET /api/patient/profile',
      'GET /api/analytics/patient-cohorts',
      'GET /api/analytics/hospital-metrics',
      'GET /api/search/patients/:id',
      'POST /api/triage/er/add-patient',
      'POST /api/scheduling/optimize-or'
    ]
  });
});

app.listen(PORT, () => {
  console.log('\n🏥 ========================================');
  console.log('   Scanlytics Healthcare Platform API v2.0');
  console.log('========================================\n');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health\n`);
  
  console.log('🔧 New Features:');
  console.log('   🔍 Binary Search - Patient/Drug lookup');
  console.log('   🚨 Priority Queue - ER Triage');
  console.log('   ⚡ Hash Maps - O(1) lookups');
  console.log('   📊 Dynamic Programming - OR scheduling');
  console.log('   🧠 AI Integration - Medical scan analysis');
  console.log('   📈 MongoDB Aggregation - Analytics\n');
  
  console.log('🎯 Quick Test Endpoints:');
  console.log(`   GET  ${PORT}/api/analytics/hospital-metrics`);
  console.log(`   GET  ${PORT}/api/search/patients/P001`);
  console.log(`   GET  ${PORT}/api/triage/er/queue`);
  console.log(`   GET  ${PORT}/api/scheduling/sample-or-schedule\n`);
  
  console.log('🔐 Demo credentials:');
  console.log('   patient@demo.com / demo123');
  console.log('   doctor@demo.com / demo123');
  console.log('   hospital@demo.com / demo123\n');
});
