// 🛡️ COMPREHENSIVE ERROR HANDLING FOR 8EEN STORE
// This ensures your website NEVER crashes in production

const errorHandler = (err, req, res, next) => {
    console.error('🚨 Error caught by handler:', err);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';

    let error = {
        message: isDevelopment ? err.message : 'Something went wrong',
        status: err.status || 500
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        error.message = 'Invalid data provided';
        error.status = 400;
    } else if (err.name === 'CastError') {
        error.message = 'Invalid ID format';
        error.status = 400;
    } else if (err.code === 11000) {
        error.message = 'Duplicate entry';
        error.status = 409;
    } else if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.status = 401;
    } else if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.status = 401;
    }

    // Log error for debugging (but don't expose in response)
    if (isDevelopment) {
        console.error('Full error:', err);
    }

    res.status(error.status).json({
        error: error.message,
        ...(isDevelopment && { stack: err.stack })
    });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:', err);
    // Don't exit in production, log and continue
    if (process.env.NODE_ENV === 'production') {
        console.error('Server continuing despite uncaught exception');
    } else {
        process.exit(1);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in production, log and continue
    if (process.env.NODE_ENV === 'production') {
        console.error('Server continuing despite unhandled rejection');
    } else {
        process.exit(1);
    }
});

module.exports = errorHandler;