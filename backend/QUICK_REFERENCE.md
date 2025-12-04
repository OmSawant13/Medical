# Quick Reference Guide

## 🚀 Start Server

```bash
cd backend
npm install
npm start
```

Server runs on: `http://localhost:5001`

## 📚 View Full Documentation

```bash
curl http://localhost:5001/api/docs | json_pp
```

Or visit in browser: `http://localhost:5001/api/docs`

## 🧪 Run Tests

```bash
node test-api.js
```

## 🔥 Most Useful Endpoints

### 1. Hospital Dashboard
```bash
curl http://localhost:5001/api/analytics/hospital-metrics
```

### 2. Search Patient (Binary Search)
```bash
curl http://localhost:5001/api/search/patients/P001
```

### 3. ER Triage Queue
```bash
# Add patient
curl -X POST http://localhost:5001/api/triage/er/add-patient \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001",
    "patientName": "John Doe",
    "condition": "Chest pain",
    "severity": "critical",
    "vitalSigns": {
      "systolic": 180,
      "diastolic": 110,
      "heartRate": 120
    }
  }'

# View queue
curl http://localhost:5001/api/triage/er/queue
```

### 4. OR Schedule Optimization
```bash
curl http://localhost:5001/api/scheduling/sample-or-schedule
```

### 5. Drug Lookup (O(1))
```bash
curl http://localhost:5001/api/search/drugs/aspirin
```

## 📊 DSA Implementations

| Algorithm | File | Complexity | Use Case |
|-----------|------|-----------|----------|
| Binary Search | `utils/dataStructures.js` | O(log n) | Patient/Drug lookup |
| Priority Queue | `utils/dataStructures.js` | O(log n) | ER Triage |
| Hash Map | `utils/dataStructures.js` | O(1) | Instant lookups |
| Dynamic Programming | `utils/dataStructures.js` | O(n²) | OR Scheduling |

## 🗂️ Route Files

- `routes/analytics.js` - MongoDB aggregation pipelines
- `routes/search.js` - Binary search & hash map lookups
- `routes/triage.js` - Priority queue for ER
- `routes/scheduling.js` - Dynamic programming optimization
- `routes/ai.js` - AI scan analysis integration
- `routes/docs.js` - API documentation

## 🔑 Key Classes

### BinarySearch
```javascript
const { BinarySearch } = require('./utils/dataStructures');
BinarySearch.search(sortedArray, target, key);
```

### PriorityQueue
```javascript
const { PriorityQueue } = require('./utils/dataStructures');
const queue = new PriorityQueue();
queue.enqueue(item, priority);
const next = queue.dequeue();
```

### FastLookupCache
```javascript
const { FastLookupCache } = require('./utils/dataStructures');
const cache = new FastLookupCache();
cache.set(key, value);
const result = cache.get(key);
```

### ORScheduler
```javascript
const { ORScheduler } = require('./utils/dataStructures');
const result = ORScheduler.optimizeSchedule(surgeries);
```

## 🎯 Common Tasks

### Add Patient to ER Queue
```javascript
POST /api/triage/er/add-patient
{
  "patientId": "P001",
  "patientName": "John Doe",
  "condition": "Emergency",
  "severity": "critical|high|medium|low",
  "vitalSigns": { ... }
}
```

### Optimize OR Schedule
```javascript
POST /api/scheduling/optimize-or
{
  "surgeries": [
    {
      "id": 1,
      "patientName": "John Smith",
      "procedure": "Surgery",
      "startTime": 8,
      "endTime": 10,
      "revenue": 15000
    }
  ]
}
```

### Upload Medical Scan
```javascript
POST /api/ai/analyze-scan
Content-Type: multipart/form-data

scanFile: [file]
patientId: "P001"
scanType: "xray" or "ct-scan"
uploadedBy: "hospital-doctor"
```

## 📈 Performance Monitoring

```bash
# Cache statistics
curl http://localhost:5001/api/search/cache/stats

# AI metrics
curl http://localhost:5001/api/ai/metrics

# Hospital metrics
curl http://localhost:5001/api/analytics/hospital-metrics
```

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/healthcare-ai
PORT=5001
JWT_SECRET=your-secret-key
AI_SERVICE_URL=http://localhost:8000
UPLOAD_DIR=uploads/
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
mongod

# Or check if running
ps aux | grep mongod
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5002
```

### AI Service Unavailable
The API will use fallback data if AI service is not running. This is normal for testing.

## 📞 Support

Check logs in: `logs/backend.log`

View server console for real-time debugging.
