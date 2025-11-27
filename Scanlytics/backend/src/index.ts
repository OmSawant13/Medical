import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Healthcare AI Platform Backend API',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Simple login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (email === 'admin@test.com' && password === 'password') {
      const userData = {
        id: Date.now().toString(),
        email,
        name: 'Demo User',
        role: role || 'patient',
        roleSpecificId: `${role?.charAt(0).toUpperCase()}${Date.now()}`
      };

      const token = jwt.sign(
        userData,
        'demo-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: { token, user: userData }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials. Use admin@test.com / password'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for http://localhost:3000`);
  console.log(`🔑 Demo login: admin@test.com / password`);
});
