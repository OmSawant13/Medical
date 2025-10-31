const { db, COLLECTIONS } = require('../config/firebase');
const { validateSwipe } = require('../middleware/validation');

class MatchingController {
    // Swipe on a profile
    async swipeProfile(req, res) {
        try {
            const { uid } = req.user;
            const { targetUserId, action } = req.body;

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

            // Create swipe record
            const swipeData = {
                userId: uid,
                targetUserId,
                action, // 'like', 'pass', 'super_like'
                createdAt: new Date()
            };

            await db.collection(COLLECTIONS.SWIPES).add(swipeData);

            // Check for mutual match
            if (action === 'like' || action === 'super_like') {
                const mutualSwipe = await db.collection(COLLECTIONS.SWIPES)
                    .where('userId', '==', targetUserId)
                    .where('targetUserId', '==', uid)
                    .where('action', 'in', ['like', 'super_like'])
                    .get();

                if (!mutualSwipe.empty) {
                    // Create match
                    const matchData = {
                        users: [uid, targetUserId].sort(),
                        createdAt: new Date(),
                        lastMessageAt: new Date(),
                        isActive: true
                    };

                    const matchRef = await db.collection(COLLECTIONS.MATCHES).add(matchData);

                    // Create conversation
                    const conversationData = {
                        matchId: matchRef.id,
                        participants: [uid, targetUserId],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        lastMessage: null,
                        unreadCount: {
                            [uid]: 0,
                            [targetUserId]: 0
                        }
                    };

                    await db.collection(COLLECTIONS.CONVERSATIONS).add(conversationData);

                    // Send match notification
                    await this.sendMatchNotification(uid, targetUserId, matchRef.id);

                    return res.json({
                        success: true,
                        message: 'It\'s a match!',
                        data: {
                            isMatch: true,
                            matchId: matchRef.id,
                            targetUserId
                        }
                    });
                }
            }

            res.json({
                success: true,
                message: 'Swipe recorded',
                data: {
                    isMatch: false,
                    action
                }
            });

        } catch (error) {
            console.error('Swipe profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to swipe profile',
                error: error.message
            });
        }
    }

    // Get matches
    async getMatches(req, res) {
        try {
            const { uid } = req.user;
            const { page = 1, limit = 20 } = req.query;

            // Get user's matches
            const matchesQuery = await db.collection(COLLECTIONS.MATCHES)
                .where('users', 'array-contains', uid)
                .where('isActive', '==', true)
                .orderBy('lastMessageAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit))
                .get();

            const matches = [];
            for (const doc of matchesQuery.docs) {
                const matchData = doc.data();
                const otherUserId = matchData.users.find(id => id !== uid);

                // Get other user's profile
                const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(otherUserId).get();

                if (profileDoc.exists) {
                    const profileData = profileDoc.data();

                    // Get last message
                    const lastMessageQuery = await db.collection(COLLECTIONS.MESSAGES)
                        .where('conversationId', '==', doc.id)
                        .orderBy('createdAt', 'desc')
                        .limit(1)
                        .get();

                    let lastMessage = null;
                    if (!lastMessageQuery.empty) {
                        const messageDoc = lastMessageQuery.docs[0];
                        lastMessage = {
                            id: messageDoc.id,
                            content: messageDoc.data().content,
                            senderId: messageDoc.data().senderId,
                            createdAt: messageDoc.data().createdAt
                        };
                    }

                    matches.push({
                        id: doc.id,
                        ...matchData,
                        otherUser: {
                            id: otherUserId,
                            firstName: profileData.firstName,
                            lastName: profileData.lastName,
                            age: profileData.age,
                            photos: profileData.photos,
                            isOnline: profileData.isOnline,
                            lastSeen: profileData.lastSeen
                        },
                        lastMessage
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    matches,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: matches.length
                    }
                }
            });

        } catch (error) {
            console.error('Get matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get matches',
                error: error.message
            });
        }
    }

    // Get profiles that liked the user
    async getLikedProfiles(req, res) {
        try {
            const { uid } = req.user;
            const { page = 1, limit = 20 } = req.query;

            // Get profiles that liked the current user
            const likesQuery = await db.collection(COLLECTIONS.SWIPES)
                .where('targetUserId', '==', uid)
                .where('action', 'in', ['like', 'super_like'])
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit))
                .get();

            const likedProfiles = [];
            for (const doc of likesQuery.docs) {
                const likeData = doc.data();

                // Check if user has already swiped on this profile
                const userSwipe = await db.collection(COLLECTIONS.SWIPES)
                    .where('userId', '==', uid)
                    .where('targetUserId', '==', likeData.userId)
                    .get();

                if (userSwipe.empty) {
                    // Get profile data
                    const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(likeData.userId).get();

                    if (profileDoc.exists) {
                        const profileData = profileDoc.data();
                        likedProfiles.push({
                            id: profileData.userId,
                            ...profileData,
                            likedAt: likeData.createdAt,
                            action: likeData.action
                        });
                    }
                }
            }

            res.json({
                success: true,
                data: {
                    profiles: likedProfiles,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: likedProfiles.length
                    }
                }
            });

        } catch (error) {
            console.error('Get liked profiles error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get liked profiles',
                error: error.message
            });
        }
    }

    // Get counts for UI badges
    async getLikedYouCount(req, res) {
        try {
            const { uid } = req.user;
            const { today = 'false' } = req.query;

            let query = db.collection(COLLECTIONS.SWIPES)
                .where('targetUserId', '==', uid)
                .where('action', 'in', ['like', 'super_like']);

            if (today === 'true') {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                query = query.where('createdAt', '>=', startOfDay);
            }

            const snapshot = await query.get();

            // Exclude those the user already swiped back on
            const swipedBack = await db.collection(COLLECTIONS.SWIPES)
                .where('userId', '==', uid)
                .get();
            const swipedBackIds = new Set(swipedBack.docs.map(d => d.data().targetUserId));

            const count = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                return swipedBackIds.has(data.userId) ? acc : acc + 1;
            }, 0);

            res.json({ success: true, data: { count } });
        } catch (error) {
            console.error('Get liked-you count error:', error);
            res.status(500).json({ success: false, message: 'Failed to get liked-you count', error: error.message });
        }
    }

    async getMatchesCount(req, res) {
        try {
            const { uid } = req.user;

            const snapshot = await db.collection(COLLECTIONS.MATCHES)
                .where('users', 'array-contains', uid)
                .where('isActive', '==', true)
                .get();

            res.json({ success: true, data: { count: snapshot.size } });
        } catch (error) {
            console.error('Get matches count error:', error);
            res.status(500).json({ success: false, message: 'Failed to get matches count', error: error.message });
        }
    }

    // Get swipe history
    async getSwipeHistory(req, res) {
        try {
            const { uid } = req.user;
            const { page = 1, limit = 20, action = null } = req.query;

            let query = db.collection(COLLECTIONS.SWIPES)
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit));

            if (action) {
                query = query.where('action', '==', action);
            }

            const snapshot = await query.get();
            const swipes = [];

            for (const doc of snapshot.docs) {
                const swipeData = doc.data();

                // Get target user's profile
                const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(swipeData.targetUserId).get();

                if (profileDoc.exists) {
                    const profileData = profileDoc.data();
                    swipes.push({
                        id: doc.id,
                        ...swipeData,
                        targetUser: {
                            id: profileData.userId,
                            firstName: profileData.firstName,
                            lastName: profileData.lastName,
                            age: profileData.age,
                            photos: profileData.photos
                        }
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    swipes,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: swipes.length
                    }
                }
            });

        } catch (error) {
            console.error('Get swipe history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get swipe history',
                error: error.message
            });
        }
    }

    // Get match suggestions (discover profiles)
    async getMatchSuggestions(req, res) {
        try {
            const { uid } = req.user;
            const { limit = 10 } = req.query;

            // Get current user's profile
            const currentUserDoc = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();
            const currentUserData = currentUserDoc.data();

            if (!currentUserData) {
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found'
                });
            }

            // Get users that the current user has already swiped on
            const swipedUsers = await db.collection(COLLECTIONS.SWIPES)
                .where('userId', '==', uid)
                .get();

            const swipedUserIds = swipedUsers.docs.map(doc => doc.data().targetUserId);

            // Get blocked users
            const blockedUsers = await db.collection('blocked_users')
                .where('blockerId', '==', uid)
                .get();

            const blockedUserIds = blockedUsers.docs.map(doc => doc.data().blockedUserId);

            // Build query for suggestions
            let query = db.collection(COLLECTIONS.PROFILES)
                .where('userId', '!=', uid)
                .where('isOnline', '==', true);

            // Filter by gender preference (if set)
            if (currentUserData.genderPreference && currentUserData.genderPreference !== 'all') {
                query = query.where('gender', '==', currentUserData.genderPreference);
            }

            // Filter by age range (if set)
            if (currentUserData.ageRangeMin) {
                query = query.where('age', '>=', currentUserData.ageRangeMin);
            }
            if (currentUserData.ageRangeMax) {
                query = query.where('age', '<=', currentUserData.ageRangeMax);
            }

            const snapshot = await query.limit(parseInt(limit) * 3).get(); // Get more to filter
            let suggestions = [];

            snapshot.forEach(doc => {
                const profileData = doc.data();

                // Skip if already swiped or blocked
                if (swipedUserIds.includes(profileData.userId) ||
                    blockedUserIds.includes(profileData.userId)) {
                    return;
                }

                // Calculate compatibility score
                const compatibilityScore = this.calculateCompatibility(currentUserData, profileData);

                suggestions.push({
                    id: doc.id,
                    ...profileData,
                    compatibilityScore
                });
            });

            // Sort by compatibility score and limit results
            suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
            suggestions = suggestions.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: suggestions
            });

        } catch (error) {
            console.error('Get match suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get match suggestions',
                error: error.message
            });
        }
    }

    // Calculate compatibility score between two profiles
    calculateCompatibility(profile1, profile2) {
        let score = 0;
        let factors = 0;

        // Age compatibility
        if (profile1.age && profile2.age) {
            const ageDiff = Math.abs(profile1.age - profile2.age);
            const ageScore = Math.max(0, 100 - (ageDiff * 2));
            score += ageScore;
            factors++;
        }

        // Interest compatibility
        if (profile1.interests && profile2.interests) {
            const commonInterests = profile1.interests.filter(interest =>
                profile2.interests.includes(interest)
            );
            const interestScore = (commonInterests.length / Math.max(profile1.interests.length, profile2.interests.length)) * 100;
            score += interestScore;
            factors++;
        }

        // Location compatibility (closer is better)
        if (profile1.location && profile2.location) {
            const distance = this.calculateDistance(
                profile1.location.latitude,
                profile1.location.longitude,
                profile2.location.latitude,
                profile2.location.longitude
            );
            const locationScore = Math.max(0, 100 - (distance * 2));
            score += locationScore;
            factors++;
        }

        // Education compatibility
        if (profile1.education && profile2.education) {
            if (profile1.education === profile2.education) {
                score += 50;
            }
            factors++;
        }

        // Occupation compatibility
        if (profile1.occupation && profile2.occupation) {
            if (profile1.occupation === profile2.occupation) {
                score += 30;
            }
            factors++;
        }

        return factors > 0 ? Math.round(score / factors) : 0;
    }

    // Calculate distance between two coordinates
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Send match notification
    async sendMatchNotification(userId1, userId2, matchId) {
        try {
            // This would integrate with your notification service
            // For now, we'll just log it
            console.log(`Match created between ${userId1} and ${userId2}, matchId: ${matchId}`);

            // You could send push notifications here
            // await this.sendPushNotification(userId1, 'New Match!', 'You have a new match!');
            // await this.sendPushNotification(userId2, 'New Match!', 'You have a new match!');
        } catch (error) {
            console.error('Error sending match notification:', error);
        }
    }

    // Unmatch users
    async unmatch(req, res) {
        try {
            const { uid } = req.user;
            const { matchId } = req.params;

            // Get match data
            const matchDoc = await db.collection(COLLECTIONS.MATCHES).doc(matchId).get();

            if (!matchDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            const matchData = matchDoc.data();

            if (!matchData.users.includes(uid)) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not part of this match'
                });
            }

            // Deactivate match
            await db.collection(COLLECTIONS.MATCHES).doc(matchId).update({
                isActive: false,
                unmatchedBy: uid,
                unmatchedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Match removed successfully'
            });

        } catch (error) {
            console.error('Unmatch error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unmatch',
                error: error.message
            });
        }
    }
}

module.exports = new MatchingController();