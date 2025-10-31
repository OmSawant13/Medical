const { db, COLLECTIONS } = require('../config/firebase');

class GamificationController {
    // Get user points and level
    async getUserPoints(req, res) {
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
            const points = userData.points || 0;
            const level = this.calculateLevel(points);

            res.json({
                success: true,
                data: {
                    points,
                    level,
                    nextLevelPoints: this.getNextLevelPoints(level),
                    progress: this.calculateProgress(points, level)
                }
            });

        } catch (error) {
            console.error('Get user points error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user points',
                error: error.message
            });
        }
    }

    // Add points to user
    async addPoints(req, res) {
        try {
            const { uid } = req.user;
            const { points, reason, description } = req.body;

            if (!points || points <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid points value'
                });
            }

            // Get current user data
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
            const userData = userDoc.data();
            const currentPoints = userData.points || 0;
            const newPoints = currentPoints + points;

            // Update user points
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                points: newPoints,
                updatedAt: new Date()
            });

            // Create points transaction record
            const transactionData = {
                userId: uid,
                points,
                reason: reason || 'general',
                description: description || '',
                type: 'earned',
                createdAt: new Date()
            };

            await db.collection(COLLECTIONS.REWARDS).add(transactionData);

            // Check for level up
            const oldLevel = this.calculateLevel(currentPoints);
            const newLevel = this.calculateLevel(newPoints);

            let levelUpReward = null;
            if (newLevel > oldLevel) {
                levelUpReward = await this.processLevelUp(uid, newLevel);
            }

            res.json({
                success: true,
                message: 'Points added successfully',
                data: {
                    points: newPoints,
                    level: newLevel,
                    levelUp: newLevel > oldLevel,
                    levelUpReward
                }
            });

        } catch (error) {
            console.error('Add points error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add points',
                error: error.message
            });
        }
    }

    // Get leaderboard
    async getLeaderboard(req, res) {
        try {
            const { type = 'points', limit = 50 } = req.query;

            let orderBy = 'points';
            if (type === 'matches') {
                orderBy = 'matchesCount';
            } else if (type === 'likes') {
                orderBy = 'likesReceived';
            }

            const leaderboardQuery = await db.collection(COLLECTIONS.USERS)
                .orderBy(orderBy, 'desc')
                .limit(parseInt(limit))
                .get();

            const leaderboard = [];
            let rank = 1;

            for (const doc of leaderboardQuery.docs) {
                const userData = doc.data();

                // Get profile data
                const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(doc.id).get();
                const profileData = profileDoc.exists ? profileDoc.data() : {};

                leaderboard.push({
                    rank,
                    userId: doc.id,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    points: userData.points || 0,
                    level: this.calculateLevel(userData.points || 0),
                    profilePicture: profileData.photos ? profileData.photos[0] : null,
                    isOnline: profileData.isOnline || false
                });
            }

        } catch (error) {
            console.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get leaderboard',
                error: error.message
            });
        }
    }

    // Daily check-in
    async dailyCheckIn(req, res) {
        try {
            const { uid } = req.user;

            // Check if user has already checked in today
            const today = new Date().toDateString();
            const checkInQuery = await db.collection(COLLECTIONS.REWARDS)
                .where('userId', '==', uid)
                .where('reason', '==', 'daily_checkin')
                .where('createdAt', '>=', new Date(today))
                .get();

            if (!checkInQuery.empty) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already checked in today'
                });
            }

            // Calculate streak
            const streak = await this.calculateStreak(uid);
            const points = this.calculateCheckInPoints(streak);

            // Add points
            await this.addPointsToUser(uid, points, 'daily_checkin', `Daily check-in (${streak} day streak)`);

            // Update streak
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                dailyStreak: streak + 1,
                lastCheckIn: new Date(),
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Daily check-in successful',
                data: {
                    points,
                    streak: streak + 1,
                    nextCheckInReward: this.calculateCheckInPoints(streak + 1)
                }
            });

        } catch (error) {
            console.error('Daily check-in error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check in',
                error: error.message
            });
        }
    }

    // Lucky spin
    async luckySpin(req, res) {
        try {
            const { uid } = req.user;

            // Check if user has enough points for spin
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
            const userData = userDoc.data();
            const currentPoints = userData.points || 0;

            const spinCost = 100; // Points required for one spin
            if (currentPoints < spinCost) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough points. You need ${spinCost} points for a spin.`
                });
            }

            // Deduct points
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                points: currentPoints - spinCost,
                updatedAt: new Date()
            });

            // Spin the wheel
            const spinResult = this.performLuckySpin();

            // Add rewards
            if (spinResult.points > 0) {
                await this.addPointsToUser(uid, spinResult.points, 'lucky_spin', `Lucky spin: ${spinResult.description}`);
            }

            // Record spin
            const spinData = {
                userId: uid,
                cost: spinCost,
                reward: spinResult,
                createdAt: new Date()
            };

            await db.collection(COLLECTIONS.REWARDS).add(spinData);

            res.json({
                success: true,
                message: 'Lucky spin completed',
                data: {
                    result: spinResult,
                    remainingPoints: currentPoints - spinCost
                }
            });

        } catch (error) {
            console.error('Lucky spin error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to perform lucky spin',
                error: error.message
            });
        }
    }

    // Get rewards history
    async getRewardsHistory(req, res) {
        try {
            const { uid } = req.user;
            const { page = 1, limit = 20 } = req.query;

            const rewardsQuery = await db.collection(COLLECTIONS.REWARDS)
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit))
                .get();

            const rewards = [];
            rewardsQuery.forEach(doc => {
                rewards.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.json({
                success: true,
                data: {
                    rewards,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: rewards.length
                    }
                }
            });

        } catch (error) {
            console.error('Get rewards history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get rewards history',
                error: error.message
            });
        }
    }

    // Calculate level based on points
    calculateLevel(points) {
        if (points < 100) return 1;
        if (points < 300) return 2;
        if (points < 600) return 3;
        if (points < 1000) return 4;
        if (points < 1500) return 5;
        if (points < 2100) return 6;
        if (points < 2800) return 7;
        if (points < 3600) return 8;
        if (points < 4500) return 9;
        return 10;
    }

    // Get points required for next level
    getNextLevelPoints(currentLevel) {
        const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
        return levelThresholds[currentLevel + 1] || levelThresholds[levelThresholds.length - 1];
    }

    // Calculate progress to next level
    calculateProgress(points, level) {
        const currentLevelPoints = this.getNextLevelPoints(level - 1);
        const nextLevelPoints = this.getNextLevelPoints(level);
        const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
        return Math.min(100, Math.max(0, progress));
    }

    // Calculate check-in streak
    async calculateStreak(uid) {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
        const userData = userDoc.data();

        if (!userData.lastCheckIn) return 0;

        const lastCheckIn = userData.lastCheckIn.toDate();
        const today = new Date();
        const diffTime = today - lastCheckIn;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return userData.dailyStreak || 0;
        } else if (diffDays > 1) {
            return 0; // Streak broken
        } else {
            return userData.dailyStreak || 0;
        }
    }

    // Calculate check-in points based on streak
    calculateCheckInPoints(streak) {
        const basePoints = 10;
        const streakBonus = Math.min(streak * 2, 50); // Max 50 bonus points
        return basePoints + streakBonus;
    }

    // Perform lucky spin
    performLuckySpin() {
        const rewards = [
            { type: 'points', points: 50, description: '50 points' },
            { type: 'points', points: 100, description: '100 points' },
            { type: 'points', points: 200, description: '200 points' },
            { type: 'points', points: 500, description: '500 points' },
            { type: 'super_like', points: 0, description: '1 Super Like' },
            { type: 'boost', points: 0, description: 'Profile Boost' },
            { type: 'points', points: 10, description: '10 points' },
            { type: 'points', points: 25, description: '25 points' }
        ];

        const randomIndex = Math.floor(Math.random() * rewards.length);
        return rewards[randomIndex];
    }

    // Add points to user (internal method)
    async addPointsToUser(uid, points, reason, description) {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
        const userData = userDoc.data();
        const currentPoints = userData.points || 0;

        await db.collection(COLLECTIONS.USERS).doc(uid).update({
            points: currentPoints + points,
            updatedAt: new Date()
        });

        const transactionData = {
            userId: uid,
            points,
            reason,
            description,
            type: 'earned',
            createdAt: new Date()
        };

        await db.collection(COLLECTIONS.REWARDS).add(transactionData);
    }

    // Process level up rewards
    async processLevelUp(uid, newLevel) {
        const levelRewards = {
            2: { points: 50, description: 'Level 2 reward' },
            3: { points: 100, description: 'Level 3 reward' },
            4: { points: 150, description: 'Level 4 reward' },
            5: { points: 250, description: 'Level 5 reward' },
            6: { points: 400, description: 'Level 6 reward' },
            7: { points: 600, description: 'Level 7 reward' },
            8: { points: 800, description: 'Level 8 reward' },
            9: { points: 1000, description: 'Level 9 reward' },
            10: { points: 1500, description: 'Level 10 reward' }
        };

        const reward = levelRewards[newLevel];
        if (reward) {
            await this.addPointsToUser(uid, reward.points, 'level_up', reward.description);
            return reward;
        }

        return null;
    }
}

module.exports = new GamificationController();