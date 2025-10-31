const { auth, db, COLLECTIONS } = require('../config/firebase');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    // Register new user
    async register(req, res) {
        try {
            const { email, password, firstName, lastName, phone, dateOfBirth, gender, location, interests, photos, bio } = req.body;

            // Check if user already exists
            const existingUser = await db.collection(COLLECTIONS.USERS).where('email', '==', email).get();
            if (!existingUser.empty) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }

            // Create Firebase Auth user
            const userRecord = await auth.createUser({
                email,
                password,
                displayName: `${firstName} ${lastName}`,
                emailVerified: false
            });

            // Hash password for additional security
            const hashedPassword = await bcrypt.hash(password, 12);

            // Calculate age from date of birth
            const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

            // Create user document in Firestore
            const userData = {
                uid: userRecord.uid,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                dateOfBirth: new Date(dateOfBirth),
                age,
                gender,
                location,
                interests,
                photos,
                bio: bio || '',
                isVerified: false,
                isPremium: false,
                status: 'active',
                lastActive: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userData);

            // Create profile document
            const profileData = {
                userId: userRecord.uid,
                firstName,
                lastName,
                age,
                gender,
                location,
                interests,
                photos,
                bio: bio || '',
                height: null,
                education: null,
                occupation: null,
                relationshipStatus: 'single',
                lookingFor: 'serious',
                drinking: null,
                smoking: null,
                exercise: null,
                isVerified: false,
                isOnline: true,
                lastSeen: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection(COLLECTIONS.PROFILES).doc(userRecord.uid).set(profileData);

            // Send verification email
            await this.sendVerificationEmail(userRecord.uid, email);

            // Generate JWT token
            const token = jwt.sign({ uid: userRecord.uid, email },
                process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    uid: userRecord.uid,
                    email,
                    firstName,
                    lastName,
                    token,
                    isVerified: false
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Get user from Firestore
            const userQuery = await db.collection(COLLECTIONS.USERS).where('email', '==', email).get();

            if (userQuery.empty) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();

            // Check if account is active
            if (userData.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Account is not active'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, userData.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Update last active
            await db.collection(COLLECTIONS.USERS).doc(userData.uid).update({
                lastActive: new Date(),
                updatedAt: new Date()
            });

            // Update profile online status
            await db.collection(COLLECTIONS.PROFILES).doc(userData.uid).update({
                isOnline: true,
                lastSeen: new Date(),
                updatedAt: new Date()
            });

            // Generate JWT token
            const token = jwt.sign({ uid: userData.uid, email },
                process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    uid: userData.uid,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    token,
                    isVerified: userData.isVerified,
                    isPremium: userData.isPremium
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    }

    // Google OAuth login
    async googleLogin(req, res) {
        try {
            const { idToken } = req.body;

            // Verify Google ID token
            const decodedToken = await auth.verifyIdToken(idToken);
            const { uid, email, name, picture } = decodedToken;

            // Check if user exists
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();

            if (!userDoc.exists) {
                // Create new user
                const [firstName, ...lastNameParts] = name.split(' ');
                const lastName = lastNameParts.join(' ') || '';

                const userData = {
                    uid,
                    email,
                    firstName,
                    lastName,
                    profilePicture: picture,
                    isVerified: true, // Google accounts are pre-verified
                    isPremium: false,
                    status: 'active',
                    lastActive: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await db.collection(COLLECTIONS.USERS).doc(uid).set(userData);

                // Create basic profile
                const profileData = {
                    userId: uid,
                    firstName,
                    lastName,
                    profilePicture: picture,
                    isVerified: true,
                    isOnline: true,
                    lastSeen: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await db.collection(COLLECTIONS.PROFILES).doc(uid).set(profileData);
            } else {
                // Update existing user
                await db.collection(COLLECTIONS.USERS).doc(uid).update({
                    lastActive: new Date(),
                    updatedAt: new Date()
                });

                await db.collection(COLLECTIONS.PROFILES).doc(uid).update({
                    isOnline: true,
                    lastSeen: new Date(),
                    updatedAt: new Date()
                });
            }

            // Generate JWT token
            const token = jwt.sign({ uid, email },
                process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                message: 'Google login successful',
                data: {
                    uid,
                    email,
                    name,
                    picture,
                    token,
                    isVerified: true
                }
            });

        } catch (error) {
            console.error('Google login error:', error);
            res.status(500).json({
                success: false,
                message: 'Google login failed',
                error: error.message
            });
        }
    }

    // Send verification email
    async sendVerificationEmail(uid, email) {
        try {
            const actionCodeSettings = {
                url: `${process.env.CLIENT_URL}/verify-email?uid=${uid}`,
                handleCodeInApp: true
            };

            const link = await auth.generateEmailVerificationLink(email, actionCodeSettings);

            // In a real app, you would send this via email service
            console.log('Verification link:', link);

            return link;
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw error;
        }
    }

    // Verify email
    async verifyEmail(req, res) {
        try {
            const { uid } = req.params;

            // Update user verification status
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                isVerified: true,
                updatedAt: new Date()
            });

            await db.collection(COLLECTIONS.PROFILES).doc(uid).update({
                isVerified: true,
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Email verified successfully'
            });

        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Email verification failed',
                error: error.message
            });
        }
    }

    // Send password reset email
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const userQuery = await db.collection(COLLECTIONS.USERS).where('email', '==', email).get();

            if (userQuery.empty) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const actionCodeSettings = {
                url: `${process.env.CLIENT_URL}/reset-password`,
                handleCodeInApp: true
            };

            const link = await auth.generatePasswordResetLink(email, actionCodeSettings);

            // In a real app, you would send this via email service
            console.log('Password reset link:', link);

            res.json({
                success: true,
                message: 'Password reset email sent'
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send password reset email',
                error: error.message
            });
        }
    }

    // Reset password
    async resetPassword(req, res) {
        try {
            const { uid, newPassword } = req.body;

            // Update password in Firebase Auth
            await auth.updateUser(uid, {
                password: newPassword
            });

            // Hash and update password in Firestore
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                password: hashedPassword,
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                message: 'Password reset failed',
                error: error.message
            });
        }
    }

    // Logout user
    async logout(req, res) {
        try {
            const { uid } = req.user;

            // Update user status
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                lastActive: new Date(),
                updatedAt: new Date()
            });

            // Update profile offline status
            await db.collection(COLLECTIONS.PROFILES).doc(uid).update({
                isOnline: false,
                lastSeen: new Date(),
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    }

    // Get current user
    async getCurrentUser(req, res) {
        try {
            const { uid } = req.user;

            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
            const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();

            if (!userDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userData = userDoc.data();
            const profileData = profileDoc.exists ? profileDoc.data() : null;

            // Remove sensitive data
            delete userData.password;

            res.json({
                success: true,
                data: {
                    user: userData,
                    profile: profileData
                }
            });

        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user data',
                error: error.message
            });
        }
    }

    // Delete account
    async deleteAccount(req, res) {
        try {
            const { uid } = req.user;
            const { password } = req.body;

            // Verify password
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
            const userData = userDoc.data();

            const isPasswordValid = await bcrypt.compare(password, userData.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }

            // Delete Firebase Auth user
            await auth.deleteUser(uid);

            // Delete user data from Firestore
            await db.collection(COLLECTIONS.USERS).doc(uid).delete();
            await db.collection(COLLECTIONS.PROFILES).doc(uid).delete();

            // Delete related data (matches, messages, etc.)
            // This would be implemented based on your data retention policy

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });

        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: 'Account deletion failed',
                error: error.message
            });
        }
    }
}

module.exports = new AuthController();