#!/bin/bash

echo "🚀 Starting Healthcare AI Backend..."

# Start MongoDB if not running
brew services start mongodb-community 2>/dev/null || echo "MongoDB already running or not installed via brew"

# Navigate to backend directory
cd backend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start the server
echo "🔥 Starting backend server on port 5000..."
npm run dev
