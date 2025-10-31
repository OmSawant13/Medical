const { db, COLLECTIONS } = require('../config/firebase');
const { validateMessage } = require('../middleware/validation');

class ChatController {
    // Send message
    async sendMessage(req, res) {
        try {
            const { uid } = req.user;
            const { conversationId, content, type = 'text', replyTo } = req.body;

            // Check if conversation exists and user is part of it
            const conversationDoc = await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).get();

            if (!conversationDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            const conversationData = conversationDoc.data();

            if (!conversationData.participants.includes(uid)) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not part of this conversation'
                });
            }

            // Create message
            const messageData = {
                conversationId,
                senderId: uid,
                content,
                type,
                replyTo: replyTo || null,
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const messageRef = await db.collection(COLLECTIONS.MESSAGES).add(messageData);

            // Update conversation
            await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).update({
                lastMessage: {
                    content,
                    senderId: uid,
                    createdAt: new Date()
                },
                updatedAt: new Date()
            });

            // Update unread count for other participants
            const otherParticipants = conversationData.participants.filter(id => id !== uid);
            const unreadCount = {...conversationData.unreadCount };

            otherParticipants.forEach(participantId => {
                unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
            });

            await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).update({
                unreadCount
            });

            // Send real-time notification to other participants
            // This would integrate with Socket.IO or similar
            await this.sendMessageNotification(conversationId, uid, content, otherParticipants);

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    id: messageRef.id,
                    ...messageData
                }
            });

        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send message',
                error: error.message
            });
        }
    }

    // Get messages for a conversation
    async getMessages(req, res) {
        try {
            const { uid } = req.user;
            const { conversationId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            // Check if conversation exists and user is part of it
            const conversationDoc = await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).get();

            if (!conversationDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            const conversationData = conversationDoc.data();

            if (!conversationData.participants.includes(uid)) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not part of this conversation'
                });
            }

            // Get messages
            const messagesQuery = await db.collection(COLLECTIONS.MESSAGES)
                .where('conversationId', '==', conversationId)
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit))
                .get();

            const messages = [];
            messagesQuery.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Mark messages as read
            await this.markMessagesAsRead(conversationId, uid);

            res.json({
                success: true,
                data: {
                    messages: messages.reverse(), // Reverse to show oldest first
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: messages.length
                    }
                }
            });

        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get messages',
                error: error.message
            });
        }
    }

    // Get conversations
    async getConversations(req, res) {
        try {
            const { uid } = req.user;
            const { page = 1, limit = 20 } = req.query;

            // Get user's conversations
            const conversationsQuery = await db.collection(COLLECTIONS.CONVERSATIONS)
                .where('participants', 'array-contains', uid)
                .orderBy('updatedAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit))
                .get();

            const conversations = [];

            for (const doc of conversationsQuery.docs) {
                const conversationData = doc.data();
                const otherParticipantId = conversationData.participants.find(id => id !== uid);

                // Get other participant's profile
                const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(otherParticipantId).get();

                if (profileDoc.exists) {
                    const profileData = profileDoc.data();

                    conversations.push({
                        id: doc.id,
                        ...conversationData,
                        otherParticipant: {
                            id: otherParticipantId,
                            firstName: profileData.firstName,
                            lastName: profileData.lastName,
                            photos: profileData.photos,
                            isOnline: profileData.isOnline,
                            lastSeen: profileData.lastSeen
                        },
                        unreadCount: conversationData.unreadCount[uid] || 0
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    conversations,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: conversations.length
                    }
                }
            });

        } catch (error) {
            console.error('Get conversations error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversations',
                error: error.message
            });
        }
    }

    // Mark messages as read
    async markMessagesAsRead(conversationId, userId) {
        try {
            // Update unread count for the user
            const conversationDoc = await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).get();

            if (conversationDoc.exists) {
                const conversationData = conversationDoc.data();
                const unreadCount = {...conversationData.unreadCount };
                unreadCount[userId] = 0;

                await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).update({
                    unreadCount
                });
            }

            // Mark individual messages as read
            const messagesQuery = await db.collection(COLLECTIONS.MESSAGES)
                .where('conversationId', '==', conversationId)
                .where('senderId', '!=', userId)
                .where('isRead', '==', false)
                .get();

            const batch = db.batch();
            messagesQuery.forEach(doc => {
                batch.update(doc.ref, { isRead: true });
            });

            await batch.commit();

        } catch (error) {
            console.error('Mark messages as read error:', error);
        }
    }

    // Mark conversation as read
    async markConversationAsRead(req, res) {
        try {
            const { uid } = req.user;
            const { conversationId } = req.params;

            await this.markMessagesAsRead(conversationId, uid);

            res.json({
                success: true,
                message: 'Messages marked as read'
            });

        } catch (error) {
            console.error('Mark conversation as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark messages as read',
                error: error.message
            });
        }
    }

    // Delete message
    async deleteMessage(req, res) {
        try {
            const { uid } = req.user;
            const { messageId } = req.params;

            // Get message
            const messageDoc = await db.collection(COLLECTIONS.MESSAGES).doc(messageId).get();

            if (!messageDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            const messageData = messageDoc.data();

            if (messageData.senderId !== uid) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own messages'
                });
            }

            // Soft delete - mark as deleted
            await db.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Message deleted successfully'
            });

        } catch (error) {
            console.error('Delete message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete message',
                error: error.message
            });
        }
    }

    // Get unread message count
    async getUnreadCount(req, res) {
        try {
            const { uid } = req.user;

            // Get all conversations for the user
            const conversationsQuery = await db.collection(COLLECTIONS.CONVERSATIONS)
                .where('participants', 'array-contains', uid)
                .get();

            let totalUnreadCount = 0;

            conversationsQuery.forEach(doc => {
                const conversationData = doc.data();
                totalUnreadCount += conversationData.unreadCount[uid] || 0;
            });

            res.json({
                success: true,
                data: {
                    unreadCount: totalUnreadCount
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

    // Send typing indicator
    async sendTypingIndicator(req, res) {
        try {
            const { uid } = req.user;
            const { conversationId, isTyping } = req.body;

            // This would integrate with Socket.IO for real-time updates
            // For now, we'll just acknowledge the request

            res.json({
                success: true,
                message: 'Typing indicator sent'
            });

        } catch (error) {
            console.error('Send typing indicator error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send typing indicator',
                error: error.message
            });
        }
    }

    // Send message notification
    async sendMessageNotification(conversationId, senderId, content, recipients) {
        try {
            // This would integrate with your notification service
            // For now, we'll just log it
            console.log(`Message notification: ${senderId} sent "${content}" to conversation ${conversationId}`);

            // You could send push notifications here
            // recipients.forEach(recipientId => {
            //   await this.sendPushNotification(recipientId, 'New Message', content);
            // });
        } catch (error) {
            console.error('Error sending message notification:', error);
        }
    }

    // Get conversation by match ID
    async getConversationByMatch(req, res) {
        try {
            const { uid } = req.user;
            const { matchId } = req.params;

            // Get conversation by match ID
            const conversationQuery = await db.collection(COLLECTIONS.CONVERSATIONS)
                .where('matchId', '==', matchId)
                .get();

            if (conversationQuery.empty) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            const conversationDoc = conversationQuery.docs[0];
            const conversationData = conversationDoc.data();

            // Check if user is part of the conversation
            if (!conversationData.participants.includes(uid)) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not part of this conversation'
                });
            }

            res.json({
                success: true,
                data: {
                    id: conversationDoc.id,
                    ...conversationData
                }
            });

        } catch (error) {
            console.error('Get conversation by match error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversation',
                error: error.message
            });
        }
    }

    // Report message
    async reportMessage(req, res) {
        try {
            const { uid } = req.user;
            const { messageId } = req.params;
            const { reason, description } = req.body;

            // Get message
            const messageDoc = await db.collection(COLLECTIONS.MESSAGES).doc(messageId).get();

            if (!messageDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            const messageData = messageDoc.data();

            // Create report
            const reportData = {
                reporterId: uid,
                reportedMessageId: messageId,
                reportedUserId: messageData.senderId,
                conversationId: messageData.conversationId,
                reason,
                description: description || '',
                status: 'pending',
                createdAt: new Date()
            };

            await db.collection(COLLECTIONS.REPORTS).add(reportData);

            res.json({
                success: true,
                message: 'Message reported successfully'
            });

        } catch (error) {
            console.error('Report message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to report message',
                error: error.message
            });
        }
    }
}

module.exports = new ChatController();