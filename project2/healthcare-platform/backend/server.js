const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/database');

// Import new routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const hospitalRoutes = require('./routes/hospitals');
const doctorRoutes = require('./routes/doctor');

// Prescriptions route (optional - requires multer)
let prescriptionRoutes;
try {
    prescriptionRoutes = require('./routes/prescriptions');
} catch (error) {
    console.warn('⚠️  Prescriptions route not available (multer not installed)');
    prescriptionRoutes = null;
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Add logging middleware - log ALL requests to debug routing
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.originalUrl} ${req.path}`);
    if (req.originalUrl.includes('/cancel')) {
        console.log(`   ⚠️  CANCEL REQUEST DETECTED: ${req.method} ${req.originalUrl}`);
    }
    if (req.originalUrl.includes('/notifications')) {
        console.log(`   🔔 NOTIFICATIONS REQUEST: ${req.method} ${req.originalUrl} - Path: ${req.path}`);
    }
    next();
});

// Health check endpoints (both versions)
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running!', timestamp: new Date() });
});

app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'Backend v1 is running!', timestamp: new Date() });
});

// Note: Auth routes are handled by /api/v1/auth routes below
// Removed demo login handler to use real authentication

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

// NEW ROUTES - Advanced functionality with database
// These routes provide real database operations alongside the existing demo routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
if (prescriptionRoutes) {
    app.use('/api/v1/prescriptions', prescriptionRoutes);
}

// Catch all other requests
app.use('*', (req, res) => {
    if (req.originalUrl.includes('/notifications')) {
        console.log(`❌ NOTIFICATIONS ROUTE NOT FOUND: ${req.method} ${req.originalUrl}`);
        console.log(`   This means the route is not being matched by Express`);
        console.log(`   Check if patients router is properly registered`);
    }
    console.log('❓ Unmatched route:', req.method, req.originalUrl);
    res.status(404).json({
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /api/health',
            'POST /api/v1/auth/login',
            'POST /api/v1/auth/register',
            'GET /api/patient/profile',
            'POST /api/v1/auth/register',
            'GET /api/v1/patients/profile',
            'GET /api/v1/patients/notifications',
            'GET /api/v1/appointments'
        ]
    });
});

// Connect to MongoDB and start server
const startServer = async() => {
    try {
        // Try to connect to MongoDB (local or Atlas)
        try {
            await connectDB();
            console.log(`✅ MongoDB: Connected successfully`);
        } catch (dbError) {
            console.warn('⚠️  MongoDB connection failed, but server will continue...');
            console.warn('   Some features may not work without database');
            console.warn('   To fix: Start MongoDB locally or set MONGODB_URI in .env');
        }

        // Start the server (bind to localhost only)
        app.listen(PORT, '127.0.0.1', () => {
            console.log(`🚀 Healthcare Backend running on port ${PORT}`);
            console.log(`✅ Health: http://localhost:${PORT}/api/health`);
            console.log(`🔐 Auth Routes:`);
            console.log(`   POST http://localhost:${PORT}/api/v1/auth/login`);
            console.log(`   POST http://localhost:${PORT}/api/v1/auth/register`);
            console.log(`   POST http://localhost:${PORT}/api/v1/auth/refresh`);
            console.log(`\n📝 Note: Some features require MongoDB connection`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();