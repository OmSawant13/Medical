const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication
router.use(authenticateToken);

// Get notifications for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);

        const notifications = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        const unreadCount = await Notification.countDocuments({
            recipientId: userId,
            isRead: false
        });

        res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);

        // Ensure the notification belongs to the user
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: userId },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification'
        });
    }
});

// Mark ALL as read
router.put('/read-all', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);

        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notifications'
        });
    }
});

module.exports = router;
