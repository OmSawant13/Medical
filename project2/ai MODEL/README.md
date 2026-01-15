# Medical Diagnosis Bot 🤖🏥

A modern, AI-powered medical diagnosis chatbot that helps users understand possible conditions based on their symptoms. **IMPORTANT: This is for informational purposes only and is NOT a substitute for professional medical advice.**

## ⚠️ CRITICAL DISCLAIMER

**This application provides informational suggestions only and is NOT a substitute for:**
- Professional medical advice
- Medical diagnosis
- Medical treatment
- Emergency medical services

**Always consult with qualified healthcare professionals for any medical concerns. In case of a medical emergency, call your local emergency services immediately.**

## Features

- 🗣️ **Conversational Interface**: Chat-like experience similar to ChatGPT
- 🔍 **Symptom Analysis**: Intelligent symptom detection and analysis
- 📊 **Diagnostic Suggestions**: Provides possible conditions based on symptoms
- ⚠️ **Urgency Assessment**: Categorizes urgency levels (Monitor, Consult Doctor, Emergency)
- 💡 **Recommendations**: Actionable recommendations based on symptom severity
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful, user-friendly interface

## Tech Stack

- **Frontend**: React.js
- **Backend**: Flask (Python)
- **API Communication**: RESTful API with CORS support

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

## Installation & Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend Server

```bash
# From backend directory
python app.py
```

The backend will run on `http://localhost:8001`

### Start Frontend Development Server

```bash
# From frontend directory
npm start
```

The frontend will run on `http://localhost:5001`

## Usage

1. Open your browser and navigate to `http://localhost:5001`
2. Read the disclaimer carefully
3. Type your symptoms in the chat input (e.g., "I have a fever and headache")
4. The bot will analyze your symptoms and provide:
   - Possible conditions
   - Detected symptoms
   - Urgency level
   - Recommendations

## Example Queries

- "I have a fever and cough"
- "I'm experiencing chest pain and shortness of breath"
- "I have nausea and fatigue"
- "I have a headache and dizziness"

## Project Structure

```
ai MODEL/
├── backend/
│   ├── app.py              # Flask backend application
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Styles
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Global styles
│   └── package.json        # Node dependencies
└── README.md               # This file
```

## API Endpoints

### POST `/api/chat`
Send symptoms for analysis

**Request:**
```json
{
  "message": "I have a fever and headache"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Diagnosis text...",
  "possible_conditions": ["Common Cold", "Flu", ...],
  "detected_symptoms": ["fever", "headache"],
  "urgency": "consult_doctor",
  "recommendations": ["Schedule appointment...", ...],
  "timestamp": "2024-01-01T12:00:00"
}
```

### GET `/api/health`
Health check endpoint

## Configuration

You can configure the API URL by setting the `REACT_APP_API_URL` environment variable in the frontend:

```bash
# In frontend directory
export REACT_APP_API_URL=http://localhost:8001
```

Or create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:8001
```

## Important Notes

1. **Medical Accuracy**: This bot uses a knowledge base for symptom matching. For production use, consider integrating with medical databases or AI models.

2. **Security**: This is a development setup. For production:
   - Add authentication
   - Implement rate limiting
   - Use HTTPS
   - Add input validation and sanitization
   - Secure API endpoints

3. **Scalability**: For production, consider:
   - Using a production WSGI server (Gunicorn, uWSGI)
   - Database integration for conversation history
   - Caching mechanisms
   - Load balancing

## Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check if port 8001 is available
- Verify all dependencies are installed

### Frontend Issues
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check if port 5001 is available

### CORS Issues
- Ensure backend CORS is properly configured
- Check API URL in frontend environment variables

## License

This project is for educational and informational purposes only.

## Support

For issues or questions, please ensure you've read the disclaimer and understand that this tool is not a replacement for professional medical care.

---

**Remember: Always consult with qualified healthcare professionals for medical diagnosis and treatment.**

