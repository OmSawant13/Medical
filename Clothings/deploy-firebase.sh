#!/bin/bash

echo "🚀 Deploying 8EEN STORE to Firebase..."

# Install Firebase CLI if not installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "🔐 Logging into Firebase..."
firebase login

# Initialize Firebase project (if not already done)
echo "🔧 Initializing Firebase project..."
firebase init hosting --project 8een-store

# Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --project 8een-store

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://8een-store.web.app"
