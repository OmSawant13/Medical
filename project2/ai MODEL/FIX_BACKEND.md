# 🔧 Backend Fix Instructions

## Problem:
The error shows routes from a DIFFERENT backend:
- `/api/v1/auth/login` 
- `/api/v1/auth/register`
- etc.

These are NOT from our backend! Our backend should have:
- `POST /api/chat`
- `GET /api/health`
- `GET /`

## Solution:

### Step 1: Stop ALL Python processes on ports 8000 and 8001

```bash
# Kill processes on port 8000
lsof -ti:8000 | xargs kill -9

# Kill processes on port 8001  
lsof -ti:8001 | xargs kill -9
```

### Step 2: Start OUR backend properly

```bash
cd "/Users/omsawant/Desktop/ai MODEL/backend"

# Activate virtual environment
source venv/bin/activate

# If venv doesn't exist:
# python3 -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt

# Start the backend
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:8001
```

### Step 3: Verify backend is working

Open a NEW terminal and test:
```bash
curl http://localhost:8001/api/health
```

Should return:
```json
{"status":"healthy","service":"Medical Diagnosis Bot API"}
```

### Step 4: Restart frontend

```bash
cd "/Users/omsawant/Desktop/ai MODEL/frontend"
npm start
```

## Important:
- Make sure NO other backend is running on port 8000 or 8001
- Our backend MUST be on port 8001
- Frontend connects to http://localhost:8001

