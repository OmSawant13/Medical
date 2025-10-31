const { db, COLLECTIONS } = require('../config/firebase');
const { validateProfileUpdate, validateSearch } = require('../middleware/validation');

class ProfileController {
    // Get user profile
    async getProfile(req, res) {
        try {
            const { uid } = req.user;

            const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();

            if (!profileDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            const profileData = profileDoc.data();

            res.json({
                success: true,
                data: profileData
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile',
                error: error.message
            });
        }
    }

    // Update user profile
    async updateProfile(req, res) {
        try {
            const { uid } = req.user;
            const updateData = req.body;

            // Check if profile exists
            const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();

            if (!profileDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            // Calculate age if date of birth is provided
            if (updateData.dateOfBirth) {
                updateData.age = new Date().getFullYear() - new Date(updateData.dateOfBirth).getFullYear();
            }

            // Update profile
            await db.collection(COLLECTIONS.PROFILES).doc(uid).update({
                ...updateData,
                updatedAt: new Date()
            });

            // Update user data if basic info changed
            const userUpdateData = {};
            if (updateData.firstName) userUpdateData.firstName = updateData.firstName;
            if (updateData.lastName) userUpdateData.lastName = updateData.lastName;
            if (updateData.age) userUpdateData.age = updateData.age;

            if (Object.keys(userUpdateData).length > 0) {
                await db.collection(COLLECTIONS.USERS).doc(uid).update({
                    ...userUpdateData,
                    updatedAt: new Date()
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    }

    // Upload profile photos
    async uploadPhotos(req, res) {
        try {
            const { uid } = req.user;
            const { photos } = req.body; // Array of photo URLs

            if (!photos || photos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No photos provided'
                });
            }

            if (photos.length > 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 6 photos allowed'
                });
            }

            // Update profile with new photos
            await db.collection(COLLECTIONS.PROFILES).doc(uid).update({
                photos,
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Photos uploaded successfully',
                data: { photos }
            });

        } catch (error) {
            console.error('Upload photos error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload photos',
                error: error.message
            });
        }
    }

    // Delete profile photo
    async deletePhoto(req, res) {
        try {
            const { uid } = req.user;
            const { photoIndex } = req.params;

            const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();

            if (!profileDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            const profileData = profileDoc.data();
            const photos = profileData.photos || [];

            if (photoIndex >= photos.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid photo index'
                });
            }

            // Remove photo from array
            photos.splice(photoIndex, 1);

            // Update profile
            await db.collection(COLLECTIONS.PROFILES).doc(uid).update({
                photos,
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Photo deleted successfully',
                data: { photos }
            });

        } catch (error) {
            console.error('Delete photo error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete photo',
                error: error.message
            });
        }
    }

    // Search profiles
    async searchProfiles(req, res) {
        try {
            const { uid } = req.user;
            const {
                ageMin = 18,
                    ageMax = 100,
                    gender = 'all',
                    distance = 50,
                    interests = [],
                    hasPhotos = true,
                    isOnline = false,
                    isVerified = false,
                    sortBy = 'distance',
                    page = 1,
                    limit = 20
            } = req.query;

            // Get current user's location
            const currentUserDoc = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();
            const currentUserData = currentUserDoc.data();

            if (!currentUserData.location) {
                return res.status(400).json({
                    success: false,
                    message: 'Location not set. Please update your location first.'
                });
            }

            let query = db.collection(COLLECTIONS.PROFILES)
                .where('userId', '!=', uid); // Exclude current user

            // Apply filters
            if (gender !== 'all') {
                query = query.where('gender', '==', gender);
            }

            if (ageMin || ageMax) {
                if (ageMin) {
                    query = query.where('age', '>=', parseInt(ageMin));
                }
                if (ageMax) {
                    query = query.where('age', '<=', parseInt(ageMax));
                }
            }

            if (hasPhotos === 'true') {
                query = query.where('photos', '!=', []);
            }

            if (isVerified === 'true') {
                query = query.where('isVerified', '==', true);
            }

            if (isOnline === 'true') {
                query = query.where('isOnline', '==', true);
            }

            const snapshot = await query.get();
            let profiles = [];

            snapshot.forEach(doc => {
                const profileData = doc.data();

                // Calculate distance
                if (profileData.location) {
                    const distance = this.calculateDistance(
                        currentUserData.location.latitude,
                        currentUserData.location.longitude,
                        profileData.location.latitude,
                        profileData.location.longitude
                    );

                    if (distance <= parseInt(distance)) {
                        profiles.push({
                            id: doc.id,
                            ...profileData,
                            distance: Math.round(distance)
                        });
                    }
                }
            });

            // Filter by interests if provided
            if (interests.length > 0) {
                profiles = profiles.filter(profile => {
                    return interests.some(interest =>
                        profile.interests && profile.interests.includes(interest)
                    );
                });
            }

            // Sort profiles
            switch (sortBy) {
                case 'distance':
                    profiles.sort((a, b) => a.distance - b.distance);
                    break;
                case 'age':
                    profiles.sort((a, b) => a.age - b.age);
                    break;
                case 'recent':
                    profiles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    break;
                case 'popularity':
                    // Sort by number of likes (would need to implement this)
                    profiles.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
                    break;
            }

            // Pagination
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const paginatedProfiles = profiles.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    profiles: paginatedProfiles,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: profiles.length,
                        pages: Math.ceil(profiles.length / parseInt(limit))
                    }
                }
            });

        } catch (error) {
            console.error('Search profiles error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search profiles',
                error: error.message
            });
        }
    }

    // Get profile by ID
    async getProfileById(req, res) {
        try {
            const { profileId } = req.params;
            const { uid } = req.user;

            // Check if user has already swiped on this profile
            const swipeDoc = await db.collection(COLLECTIONS.SWIPES)
                .where('userId', '==', uid)
                .where('targetUserId', '==', profileId)
                .get();

            const hasSwiped = !swipeDoc.empty;

            const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(profileId).get();

            if (!profileDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            const profileData = profileDoc.data();

            // Calculate distance
            const currentUserDoc = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();
            const currentUserData = currentUserDoc.data();

            let distance = null;
            if (currentUserData.location && profileData.location) {
                distance = this.calculateDistance(
                    currentUserData.location.latitude,
                    currentUserData.location.longitude,
                    profileData.location.latitude,
                    profileData.location.longitude
                );
            }

            res.json({
                success: true,
                data: {
                    ...profileData,
                    distance: distance ? Math.round(distance) : null,
                    hasSwiped
                }
            });

        } catch (error) {
            console.error('Get profile by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile',
                error: error.message
            });
        }
    }

    // Report profile
    async reportProfile(req, res) {
        try {
            const { uid } = req.user;
            const { profileId } = req.params;
            const { reason, description, evidence } = req.body;

            const reportData = {
                reporterId: uid,
                reportedUserId: profileId,
                reason,
                description: description || '',
                evidence: evidence || [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection(COLLECTIONS.REPORTS).add(reportData);

            res.json({
                success: true,
                message: 'Profile reported successfully'
            });

        } catch (error) {
            console.error('Report profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to report profile',
                error: error.message
            });
        }
    }

    // Block user
    async blockUser(req, res) {
        try {
            const { uid } = req.user;
            const { profileId } = req.params;

            const blockData = {
                blockerId: uid,
                blockedUserId: profileId,
                createdAt: new Date()
            };

            await db.collection('blocked_users').add(blockData);

            res.json({
                success: true,
                message: 'User blocked successfully'
            });

        } catch (error) {
            console.error('Block user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to block user',
                error: error.message
            });
        }
    }

    // Unblock user
    async unblockUser(req, res) {
        try {
            const { uid } = req.user;
            const { profileId } = req.params;

            const blockQuery = await db.collection('blocked_users')
                .where('blockerId', '==', uid)
                .where('blockedUserId', '==', profileId)
                .get();

            if (!blockQuery.empty) {
                await blockQuery.docs[0].ref.delete();
            }

            res.json({
                success: true,
                message: 'User unblocked successfully'
            });

        } catch (error) {
            console.error('Unblock user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unblock user',
                error: error.message
            });
        }
    }

    // Get blocked users
    async getBlockedUsers(req, res) {
        try {
            const { uid } = req.user;

            const blockedQuery = await db.collection('blocked_users')
                .where('blockerId', '==', uid)
                .get();

            const blockedUsers = [];
            for (const doc of blockedQuery.docs) {
                const blockData = doc.data();
                const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(blockData.blockedUserId).get();

                if (profileDoc.exists) {
                    blockedUsers.push({
                        id: doc.id,
                        ...blockData,
                        profile: profileDoc.data()
                    });
                }
            }

            res.json({
                success: true,
                data: blockedUsers
            });

        } catch (error) {
            console.error('Get blocked users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get blocked users',
                error: error.message
            });
        }
    }

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = new ProfileController();