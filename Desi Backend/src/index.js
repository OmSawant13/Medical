const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Firebase configuration
const { initializeFirebase } = require('./config/firebase');

// Controllers will be imported after Firebase initialization
let authController, profileController, matchingController, chatController, premiumController, gamificationController, notificationController;

// Import middleware
const { authenticateToken, rateLimit: customRateLimit } = require('./middleware/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
initializeFirebase();

// Initialize services immediately
const { initializeServices } = require('./config/firebase');
initializeServices();

// Import controllers after Firebase initialization
authController = require('./controllers/authController');
profileController = require('./controllers/profileController');
matchingController = require('./controllers/matchingController');
chatController = require('./controllers/chatController');
premiumController = require('./controllers/premiumController');
gamificationController = require('./controllers/gamificationController');
notificationController = require('./controllers/notificationController');

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Desi Dating Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes

// Authentication routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/google-login', authController.googleLogin);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.post('/api/auth/logout', authenticateToken, authController.logout);
app.get('/api/auth/verify-email/:uid', authController.verifyEmail);
app.get('/api/auth/me', authenticateToken, authController.getCurrentUser);
app.delete('/api/auth/delete-account', authenticateToken, authController.deleteAccount);

// Profile routes
app.get('/api/profile', authenticateToken, profileController.getProfile);
app.put('/api/profile', authenticateToken, profileController.updateProfile);
app.post('/api/profile/photos', authenticateToken, profileController.uploadPhotos);
app.delete('/api/profile/photos/:photoIndex', authenticateToken, profileController.deletePhoto);
app.get('/api/profile/search', authenticateToken, profileController.searchProfiles);
app.get('/api/profile/:profileId', authenticateToken, profileController.getProfileById);
app.post('/api/profile/:profileId/report', authenticateToken, profileController.reportProfile);
app.post('/api/profile/:profileId/block', authenticateToken, profileController.blockUser);
app.delete('/api/profile/:profileId/unblock', authenticateToken, profileController.unblockUser);
app.get('/api/profile/blocked', authenticateToken, profileController.getBlockedUsers);

// Matching routes
app.post('/api/matching/swipe', authenticateToken, matchingController.swipeProfile);
app.get('/api/matching/matches', authenticateToken, matchingController.getMatches);
app.get('/api/matching/liked-you', authenticateToken, matchingController.getLikedProfiles);
app.get('/api/matching/liked-you/count', authenticateToken, matchingController.getLikedYouCount);
app.get('/api/matching/matches/count', authenticateToken, matchingController.getMatchesCount);
app.get('/api/matching/history', authenticateToken, matchingController.getSwipeHistory);
app.get('/api/matching/suggestions', authenticateToken, matchingController.getMatchSuggestions);
app.delete('/api/matching/matches/:matchId', authenticateToken, matchingController.unmatch);

// Chat routes
app.post('/api/chat/send', authenticateToken, chatController.sendMessage);
app.get('/api/chat/conversations', authenticateToken, chatController.getConversations);
app.get('/api/chat/conversations/:conversationId/messages', authenticateToken, chatController.getMessages);
app.post('/api/chat/conversations/:conversationId/read', authenticateToken, chatController.markConversationAsRead);
app.delete('/api/chat/messages/:messageId', authenticateToken, chatController.deleteMessage);
app.get('/api/chat/unread-count', authenticateToken, chatController.getUnreadCount);
app.post('/api/chat/typing', authenticateToken, chatController.sendTypingIndicator);
app.get('/api/chat/match/:matchId/conversation', authenticateToken, chatController.getConversationByMatch);
app.post('/api/chat/messages/:messageId/report', authenticateToken, chatController.reportMessage);

// Premium routes
app.get('/api/premium/plans', premiumController.getPremiumPlans);
app.post('/api/premium/subscribe', authenticateToken, premiumController.subscribeToPremium);
app.get('/api/premium/status', authenticateToken, premiumController.getPremiumStatus);
app.delete('/api/premium/cancel', authenticateToken, premiumController.cancelPremiumSubscription);
app.get('/api/premium/history', authenticateToken, premiumController.getSubscriptionHistory);
app.post('/api/premium/super-like', authenticateToken, premiumController.useSuperLike);
app.post('/api/premium/boost', authenticateToken, premiumController.boostProfile);

// Gamification routes
app.get('/api/gamification/points', authenticateToken, gamificationController.getUserPoints);
app.post('/api/gamification/add-points', authenticateToken, gamificationController.addPoints);
app.get('/api/gamification/leaderboard', gamificationController.getLeaderboard);
app.post('/api/gamification/check-in', authenticateToken, gamificationController.dailyCheckIn);
app.post('/api/gamification/lucky-spin', authenticateToken, gamificationController.luckySpin);
app.get('/api/gamification/rewards-history', authenticateToken, gamificationController.getRewardsHistory);

// Notification routes
app.post('/api/notifications/send', authenticateToken, notificationController.sendPushNotification);
app.get('/api/notifications', authenticateToken, notificationController.getUserNotifications);
app.put('/api/notifications/:notificationId/read', authenticateToken, notificationController.markNotificationAsRead);
app.put('/api/notifications/read-all', authenticateToken, notificationController.markAllNotificationsAsRead);
app.get('/api/notifications/unread-count', authenticateToken, notificationController.getUnreadCount);
app.put('/api/notifications/fcm-token', authenticateToken, notificationController.updateFCMToken);
app.delete('/api/notifications/:notificationId', authenticateToken, notificationController.deleteNotification);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.details
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Desi Dating Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;