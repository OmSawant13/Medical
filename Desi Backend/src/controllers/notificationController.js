const { db, COLLECTIONS } = require('../config/firebase');

class NotificationController {
  // Send push notification
  async sendPushNotification(req, res) {
    try {
      const { userId, title, body, data = {} } = req.body;

      // Get user's FCM token
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;

      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: 'User has not registered for notifications'
        });
      }

      // Send notification using FCM
      const notificationResult = await this.sendFCMNotification(fcmToken, title, body, data);

      if (notificationResult.success) {
        // Save notification to database
        const notificationData = {
          userId,
          title,
          body,
          data,
          type: 'push',
          status: 'sent',
          createdAt: new Date()
        };

        await db.collection(COLLECTIONS.NOTIFICATIONS).add(notificationData);

        res.json({
          success: true,
          message: 'Notification sent successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send notification',
          error: notificationResult.error
        });
      }

    } catch (error) {
      console.error('Send push notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error.message
      });
    }
  }

  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const { uid } = req.user;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      let query = db.collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset((parseInt(page) - 1) * parseInt(limit));

      if (unreadOnly === 'true') {
        query = query.where('isRead', '==', false);
      }

      const snapshot = await query.get();
      const notifications = [];

      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: notifications.length
          }
        }
      });

    } catch (error) {
      console.error('Get user notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications',
        error: error.message
      });
    }
  }

  // Mark notification as read
  async markNotificationAsRead(req, res) {
    try {
      const { uid } = req.user;
      const { notificationId } = req.params;

      const notificationDoc = await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).get();
      
      if (!notificationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const notificationData = notificationDoc.data();
      
      if (notificationData.userId !== uid) {
        return res.status(403).json({
          success: false,
          message: 'You can only mark your own notifications as read'
        });
      }

      await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).update({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(req, res) {
    try {
      const { uid } = req.user;

      const notificationsQuery = await db.collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', uid)
        .where('isRead', '==', false)
        .get();

      const batch = db.batch();
      notificationsQuery.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date()
        });
      });

      await batch.commit();

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });

    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  // Get unread notification count
  async getUnreadCount(req, res) {
    try {
      const { uid } = req.user;

      const unreadQuery = await db.collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', uid)
        .where('isRead', '==', false)
        .get();

      res.json({
        success: true,
        data: {
          unreadCount: unreadQuery.size
        }
      });

    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }

  // Update FCM token
  async updateFCMToken(req, res) {
    try {
      const { uid } = req.user;
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: 'FCM token is required'
        });
      }

      await db.collection(COLLECTIONS.USERS).doc(uid).update({
        fcmToken,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'FCM token updated successfully'
      });

    } catch (error) {
      console.error('Update FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update FCM token',
        error: error.message
      });
    }
  }

  // Send FCM notification (internal method)
  async sendFCMNotification(fcmToken, title, body, data) {
    try {
      // This would integrate with Firebase Cloud Messaging
      // For now, we'll simulate the notification
      console.log(`FCM Notification to ${fcmToken}: ${title} - ${body}`);
      
      // In a real implementation, you would use the Firebase Admin SDK
      // const message = {
      //   token: fcmToken,
      //   notification: {
      //     title,
      //     body
      //   },
      //   data
      // };
      // 
      // const response = await admin.messaging().send(message);
      // return { success: true, messageId: response };

      return { success: true, messageId: `msg_${Date.now()}` };

    } catch (error) {
      console.error('FCM notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send match notification
  async sendMatchNotification(userId1, userId2, matchId) {
    try {
      const notifications = [
        {
          userId: userId1,
          title: 'New Match!',
          body: 'You have a new match! Start chatting now.',
          data: { type: 'match', matchId, userId: userId2 }
        },
        {
          userId: userId2,
          title: 'New Match!',
          body: 'You have a new match! Start chatting now.',
          data: { type: 'match', matchId, userId: userId1 }
        }
      ];

      for (const notification of notifications) {
        await this.sendPushNotification({ body: notification }, {});
      }

    } catch (error) {
      console.error('Send match notification error:', error);
    }
  }

  // Send message notification
  async sendMessageNotification(recipientId, senderName, messageContent) {
    try {
      const notification = {
        userId: recipientId,
        title: `Message from ${senderName}`,
        body: messageContent,
        data: { type: 'message' }
      };

      await this.sendPushNotification({ body: notification }, {});

    } catch (error) {
      console.error('Send message notification error:', error);
    }
  }

  // Send super like notification
  async sendSuperLikeNotification(recipientId, senderName) {
    try {
      const notification = {
        userId: recipientId,
        title: 'Super Like!',
        body: `${senderName} super liked you!`,
        data: { type: 'super_like' }
      };

      await this.sendPushNotification({ body: notification }, {});

    } catch (error) {
      console.error('Send super like notification error:', error);
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { uid } = req.user;
      const { notificationId } = req.params;

      const notificationDoc = await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).get();
      
      if (!notificationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const notificationData = notificationDoc.data();
      
      if (notificationData.userId !== uid) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own notifications'
        });
      }

      await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).delete();

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();
