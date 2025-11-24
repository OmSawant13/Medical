# 🩺 Health-Link - Unified Healthcare Ecosystem

**Tagline:** Your Health, Connected.

A comprehensive medical platform connecting Patients, Doctors, and Hospitals with AI-powered diagnosis and seamless medical history management.

---

## ✨ Features

### **For Patients**
- 🔍 Search & book appointments with doctors
- 📱 Generate QR codes for appointments
- 🏥 View complete medical history (Health Locker)
- 🤖 AI-powered health summary
- 🔗 Share medical history securely
- 📊 Track who accessed your data
- 📅 Manage appointments (cancel/reschedule)

### **For Doctors**
- 📊 Dashboard with today's appointments
- 👥 Long-term patient management
- 📝 Daily check-ins for ongoing care
- 🤖 AI report analysis (X-rays, lab reports)
- 🧬 View family history (hereditary patterns)
- 📷 QR scanner for patient lookup
- 📅 Schedule follow-ups

### **For Hospitals**
- 🔍 Patient lookup (ID or QR code)
- 📤 Upload medical reports
- 📋 View patient allergies
- 🏥 Manage hospital operations

### **AI Features**
- 🧠 Medical report analysis (Text + Images)
- 📷 X-ray image analysis (Gemini Vision)
- 🧪 Lab report analysis
- 🧬 Hereditary pattern detection
- 📊 Health summary generation

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (File uploads)
- Google Gemini AI

**Frontend:**
- React.js
- React Router DOM
- Axios
- date-fns
- React Toastify

**Security:**
- Helmet
- CORS
- Rate Limiting
- bcryptjs
- JWT

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v14+)
- MongoDB (Local or Atlas)
- Google Gemini API Key (for AI features)
- Hugging Face API Key (optional, for enhanced medical NLP)

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd medical
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure environment variables**
Create `.env` file in root:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/healthlink

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Medical NLP (Hugging Face - Optional but recommended)
HUGGINGFACE_API_KEY=your_huggingface_token_here

# Optional: Use better models for higher accuracy
GEMINI_MODEL=gemini-1.5-pro  # Use 'pro' instead of 'flash' for ~5-8% better accuracy
HF_MEDICAL_MODEL=microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext  # Better medical model

# Server
PORT=5001
NODE_ENV=development
```

4. **Start MongoDB** (if using local)
```bash
mongod
```

5. **Create dummy users** (optional)
```bash
npm run create-users
```

6. **Start backend**
```bash
npm start
```

7. **Start frontend** (new terminal)
```bash
npm run client
```

8. **Access the app**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

---

## 📋 Default Credentials

After running `npm run create-users`, use these credentials:

**Patient:**
- Email: `patient@test.com`
- Password: `Patient123`

**Doctor:**
- Email: `sharma@doctor.com`
- Password: `Doctor123`

**Hospital:**
- Email: `hospital@test.com`
- Password: `Hospital123`

---

## 📁 Project Structure

```
medical/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, logging
│   ├── utils/           # Helpers (AI, QR, etc.)
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API calls
│   │   └── App.js      # Main app
│   └── public/
└── package.json
```

---

## 🔐 Security Features

- ✅ JWT Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ Role-Based Access Control
- ✅ Helmet Security Headers
- ✅ CORS Protection
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ Access Logging
- ✅ Secure File Uploads

---

## 📡 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login

### **Appointments**
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id/status` - Update status
- `PATCH /api/appointments/:id/cancel` - Cancel
- `PATCH /api/appointments/:id/reschedule` - Reschedule

### **Medical Records**
- `GET /api/medical-records/patient/:id` - Get records
- `POST /api/medical-records` - Upload record

### **AI**
- `POST /api/ai/analyze-report` - Analyze report (Doctor)
- `POST /api/ai/summarize-health` - Health summary (Patient)

### **Long-Term Patients**
- `GET /api/long-term-patients` - Get patients (Doctor)
- `POST /api/long-term-patients` - Add patient
- `POST /api/long-term-patients/:id/notes` - Add check-in

---

## 🤖 AI Integration

### **Primary: Google Gemini**
Uses **Google Gemini 1.5 Flash** for:
- Medical report analysis
- X-ray image analysis
- Lab report analysis
- Hereditary pattern detection

**Setup:**
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`: `GEMINI_API_KEY=your_key`

### **Enhanced: Medical NLP (Optional)**
Uses **Hugging Face Medical Models** for:
- Clinical text understanding (Bio_ClinicalBERT)
- Medical entity extraction
- Lab result analysis
- Better accuracy for medical reports

**Setup:**
1. Get free API key from [Hugging Face](https://huggingface.co/settings/tokens)
2. Add to `.env`: `HUGGINGFACE_API_KEY=your_token`
3. Automatically enhances medical analysis!

**Note:** Works without Hugging Face too, but medical NLP provides better accuracy.

---

## 🧪 Testing

```bash
# Create test users
npm run create-users

# Seed hospitals
npm run seed
```

---

## 📦 Deployment

### **Backend (Heroku/Railway)**
1. Set environment variables
2. Deploy: `git push heroku main`
3. MongoDB Atlas connection

### **Frontend (Vercel/Netlify)**
1. Build: `npm run build`
2. Deploy build folder
3. Set API URL in environment

---

## 📝 License

ISC

---

## 👥 Contributing

This is an MVP project. Contributions welcome!

---

## 🆘 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ for better healthcare**

