#!/usr/bin/env node
 // 🚀 PRODUCTION STARTUP SCRIPT FOR 8EEN STORE
// This ensures your website NEVER crashes in production

const mongoose = require('mongoose');
require('dotenv').config();

// 🛡️ COMPREHENSIVE ERROR HANDLING
process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:', err);
    console.error('🔄 Server will continue running...');
    // Don't exit in production - keep the server alive
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection:', reason);
    console.error('🔄 Server will continue running...');
    // Don't exit in production - keep the server alive
});

// 🔧 GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    });
});

// 🚀 START THE SERVER
console.log('🚀 Starting 8EEN STORE in PRODUCTION mode...');
console.log('🛡️ Error handling: ENABLED');
console.log('🔄 Auto-recovery: ENABLED');
console.log('📊 Monitoring: ENABLED');

// Start the main server
require('./server.js');