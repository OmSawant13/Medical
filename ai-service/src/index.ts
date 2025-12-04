import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { MedicalImageAI } from './services/medicalImageAI';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error('ERROR: GOOGLE_AI_API_KEY not found in environment variables');
  process.exit(1);
}

const medicalAI = new MedicalImageAI(API_KEY);

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Medical Image AI API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/analyze',
      health: 'GET /api/health',
    },
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { imageType, uploadedBy } = req.body;

    if (!imageType || !['ct-scan', 'xray'].includes(imageType)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid imageType. Must be "ct-scan" or "xray"' });
    }

    if (!uploadedBy || !['patient', 'hospital-doctor', 'clinic-doctor'].includes(uploadedBy)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Invalid uploadedBy. Must be "patient", "hospital-doctor", or "clinic-doctor"',
      });
    }

    const result = await medicalAI.analyzeImage(req.file.path, imageType, uploadedBy);

    fs.unlinkSync(req.file.path);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Medical Image AI API running on http://localhost:${PORT}`);
  console.log(`📊 Ready to analyze CT scans and X-rays`);
});
