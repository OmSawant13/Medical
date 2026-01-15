# 🚀 Quick Start Guide

## Connection Failed? Follow These Steps:

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd "/Users/omsawant/Desktop/ai MODEL/backend"

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the backend server
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:8001
```

**Keep this terminal open!**

### Step 2: Start the Frontend Server

Open a **NEW** terminal window and run:

```bash
cd "/Users/omsawant/Desktop/ai MODEL/frontend"

# Install dependencies (first time only)
npm install

# Start the frontend server
npm start
```

The browser should automatically open to `http://localhost:5001`

### Alternative: Use the Startup Script

```bash
cd "/Users/omsawant/Desktop/ai MODEL"
./start.sh
```

This will start both servers automatically.

## Troubleshooting

### "Connection Failed" Error

1. **Check if backend is running:**
   - Look for the terminal showing "Running on http://0.0.0.0:8001"
   - If not, start it using Step 1 above

2. **Check the ports:**
   - Backend should be on port 8001
   - Frontend should be on port 5001
   - Make sure nothing else is using these ports

3. **Check the API URL:**
   - The frontend should connect to `http://localhost:8001`
   - You can verify this in `frontend/src/App.js` line 5

4. **Test the backend directly:**
   ```bash
   curl http://localhost:8001/api/health
   ```
   Should return: `{"status":"healthy","service":"Medical Diagnosis Bot API"}`

### Port Already in Use?

If you get "port already in use" error:

**For backend (port 8001):**
```bash
lsof -ti:8001 | xargs kill -9
```

**For frontend (port 5001):**
```bash
lsof -ti:5001 | xargs kill -9
```

### Still Having Issues?

1. Make sure Python 3.8+ is installed: `python3 --version`
2. Make sure Node.js 16+ is installed: `node --version`
3. Make sure all dependencies are installed
4. Check browser console for detailed error messages (F12)

## Need Help?

- Check the main README.md for detailed documentation
- Verify both servers are running in separate terminals
- Check browser console (F12) for detailed error messages

