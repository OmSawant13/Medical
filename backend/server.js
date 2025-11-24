const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development (you can change this to callback(new Error('Not allowed by CORS')) for production)
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlink', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/family-history', require('./routes/familyHistory'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/access-logs', require('./routes/accessLogs'));
app.use('/api/share-history', require('./routes/shareHistory'));
app.use('/api/follow-ups', require('./routes/followUps'));
app.use('/api/long-term-patients', require('./routes/longTermPatients'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Health-Link API is running' });
});

// Global error handler
const { globalErrorHandler } = require('./utils/errorHandler');
app.use(globalErrorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

