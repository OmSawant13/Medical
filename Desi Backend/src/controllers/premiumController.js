const { db, COLLECTIONS } = require('../config/firebase');
const { validatePremiumSubscription } = require('../middleware/validation');

class PremiumController {
    // Get premium plans
    async getPremiumPlans(req, res) {
        try {
            const plans = [{
                    id: 'basic',
                    name: 'Basic',
                    price: 299,
                    currency: 'INR',
                    duration: '1_month',
                    features: [
                        'Unlimited likes',
                        'See who liked you',
                        '5 super likes per day',
                        'Advanced filters',
                        'Read receipts'
                    ],
                    popular: false
                },
                {
                    id: 'premium',
                    name: 'Premium',
                    price: 799,
                    currency: 'INR',
                    duration: '1_month',
                    features: [
                        'Everything in Basic',
                        'Unlimited super likes',
                        'Boost profile visibility',
                        'See who visited your profile',
                        'Priority customer support',
                        'Advanced analytics'
                    ],
                    popular: true
                },
                {
                    id: 'vip',
                    name: 'VIP',
                    price: 1499,
                    currency: 'INR',
                    duration: '1_month',
                    features: [
                        'Everything in Premium',
                        'Exclusive VIP badge',
                        'Priority in search results',
                        'Unlimited profile boosts',
                        'Exclusive events access',
                        'Personal dating coach'
                    ],
                    popular: false
                }
            ];

            res.json({
                success: true,
                data: plans
            });

        } catch (error) {
            console.error('Get premium plans error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get premium plans',
                error: error.message
            });
        }
    }

    // Subscribe to premium plan
    async subscribeToPremium(req, res) {
        try {
            const { uid } = req.user;
            const { planId, paymentMethod, duration } = req.body;

            // Get plan details
            const plans = {
                basic: { price: 299, name: 'Basic' },
                premium: { price: 799, name: 'Premium' },
                vip: { price: 1499, name: 'VIP' }
            };

            const plan = plans[planId];
            if (!plan) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid plan selected'
                });
            }

            // Calculate subscription duration
            const durationMap = {
                '1_month': 30,
                '3_months': 90,
                '6_months': 180,
                '1_year': 365
            };

            const days = durationMap[duration] || 30;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);

            // Process payment (integrate with payment gateway)
            const paymentResult = await this.processPayment({
                amount: plan.price,
                currency: 'INR',
                paymentMethod,
                userId: uid,
                planId
            });

            if (!paymentResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment failed',
                    error: paymentResult.error
                });
            }

            // Create subscription record
            const subscriptionData = {
                userId: uid,
                planId,
                planName: plan.name,
                amount: plan.price,
                currency: 'INR',
                duration,
                status: 'active',
                paymentMethod,
                paymentId: paymentResult.paymentId,
                startDate: new Date(),
                expiresAt,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection(COLLECTIONS.PREMIUM_SUBSCRIPTIONS).add(subscriptionData);

            // Update user premium status
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                isPremium: true,
                premiumPlan: planId,
                premiumExpiresAt: expiresAt,
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Premium subscription activated successfully',
                data: {
                    planId,
                    planName: plan.name,
                    expiresAt,
                    paymentId: paymentResult.paymentId
                }
            });

        } catch (error) {
            console.error('Subscribe to premium error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to subscribe to premium',
                error: error.message
            });
        }
    }

    // Process payment (mock implementation)
    async processPayment(paymentData) {
        try {
            // In a real app, integrate with Razorpay, Stripe, or other payment gateway
            // This is a mock implementation

            const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                paymentId,
                transactionId: `txn_${Date.now()}`
            };

        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get user's premium status
    async getPremiumStatus(req, res) {
        try {
            const { uid } = req.user;

            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();

            if (!userDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userData = userDoc.data();

            // Get active subscription
            const subscriptionQuery = await db.collection(COLLECTIONS.PREMIUM_SUBSCRIPTIONS)
                .where('userId', '==', uid)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            let activeSubscription = null;
            if (!subscriptionQuery.empty) {
                const subscriptionDoc = subscriptionQuery.docs[0];
                activeSubscription = {
                    id: subscriptionDoc.id,
                    ...subscriptionDoc.data()
                };
            }

            res.json({
                success: true,
                data: {
                    isPremium: userData.isPremium || false,
                    premiumPlan: userData.premiumPlan || null,
                    premiumExpiresAt: userData.premiumExpiresAt || null,
                    activeSubscription
                }
            });

        } catch (error) {
            console.error('Get premium status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get premium status',
                error: error.message
            });
        }
    }

    // Cancel premium subscription
    async cancelPremiumSubscription(req, res) {
        try {
            const { uid } = req.user;

            // Get active subscription
            const subscriptionQuery = await db.collection(COLLECTIONS.PREMIUM_SUBSCRIPTIONS)
                .where('userId', '==', uid)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            if (subscriptionQuery.empty) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found'
                });
            }

            const subscriptionDoc = subscriptionQuery.docs[0];
            const subscriptionData = subscriptionDoc.data();

            // Check if subscription can be cancelled (not expired)
            if (new Date() > subscriptionData.expiresAt.toDate()) {
                return res.status(400).json({
                    success: false,
                    message: 'Subscription has already expired'
                });
            }

            // Cancel subscription
            await db.collection(COLLECTIONS.PREMIUM_SUBSCRIPTIONS).doc(subscriptionDoc.id).update({
                status: 'cancelled',
                cancelledAt: new Date(),
                updatedAt: new Date()
            });

            // Update user status
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                isPremium: false,
                premiumPlan: null,
                premiumExpiresAt: null,
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Premium subscription cancelled successfully'
            });

        } catch (error) {
            console.error('Cancel premium subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel premium subscription',
                error: error.message
            });
        }
    }

    // Get subscription history
    async getSubscriptionHistory(req, res) {
        try {
            const { uid } = req.user;
            const { page = 1, limit = 10 } = req.query;

            const subscriptionsQuery = await db.collection(COLLECTIONS.PREMIUM_SUBSCRIPTIONS)
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit))
                .get();

            const subscriptions = [];
            subscriptionsQuery.forEach(doc => {
                subscriptions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.json({
                success: true,
                data: {
                    subscriptions,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: subscriptions.length
                    }
                }
            });

        } catch (error) {
            console.error('Get subscription history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get subscription history',
                error: error.message
            });
        }
    }

    // Use super like
    async useSuperLike(req, res) {
        try {
            const { uid } = req.user;
            const { targetUserId } = req.body;

            // Check if user has premium
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
            const userData = userDoc.data();

            if (!userData.isPremium) {
                return res.status(403).json({
                    success: false,
                    message: 'Premium subscription required for super likes'
                });
            }

            // Check if user has already swiped on this profile
            const existingSwipe = await db.collection(COLLECTIONS.SWIPES)
                .where('userId', '==', uid)
                .where('targetUserId', '==', targetUserId)
                .get();

            if (!existingSwipe.empty) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already swiped on this profile'
                });
            }

            // Create super like swipe
            const swipeData = {
                userId: uid,
                targetUserId,
                action: 'super_like',
                createdAt: new Date()
            };

            await db.collection(COLLECTIONS.SWIPES).add(swipeData);

            // Send super like notification
            await this.sendSuperLikeNotification(uid, targetUserId);

            res.json({
                success: true,
                message: 'Super like sent successfully'
            });

        } catch (error) {
            console.error('Use super like error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send super like',
                error: error.message
            });
        }
    }

    // Boost profile
    async boostProfile(req, res) {
        try {
            const { uid } = req.user;

            // Check if user has premium
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
            const userData = userDoc.data();

            if (!userData.isPremium) {
                return res.status(403).json({
                    success: false,
                    message: 'Premium subscription required for profile boost'
                });
            }

            // Check if user has already boosted recently
            const lastBoost = userData.lastBoostAt;
            if (lastBoost) {
                const hoursSinceLastBoost = (new Date() - lastBoost.toDate()) / (1000 * 60 * 60);
                if (hoursSinceLastBoost < 24) {
                    return res.status(400).json({
                        success: false,
                        message: 'Profile can only be boosted once every 24 hours'
                    });
                }
            }

            // Boost profile
            const boostExpiresAt = new Date();
            boostExpiresAt.setHours(boostExpiresAt.getHours() + 1); // 1 hour boost

            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                isBoosted: true,
                boostExpiresAt,
                lastBoostAt: new Date(),
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Profile boosted successfully',
                data: {
                    boostExpiresAt
                }
            });

        } catch (error) {
            console.error('Boost profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to boost profile',
                error: error.message
            });
        }
    }

    // Send super like notification
    async sendSuperLikeNotification(senderId, targetUserId) {
        try {
            // This would integrate with your notification service
            console.log(`Super like notification: ${senderId} super liked ${targetUserId}`);

            // You could send push notifications here
            // await this.sendPushNotification(targetUserId, 'Super Like!', 'Someone super liked you!');
        } catch (error) {
            console.error('Error sending super like notification:', error);
        }
    }
}

module.exports = new PremiumController();