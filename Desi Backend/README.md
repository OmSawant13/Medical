# Desi Dating Backend

A comprehensive, professional Firebase backend for the Desi Dating mobile application built with Node.js, Express, and Firebase.

## 🚀 Features

### Authentication & User Management
- Email/password authentication
- Google OAuth integration
- Email verification
- Password reset functionality
- User profile management
- Account deletion

### Profile System
- Complete profile creation and management
- Photo upload and management
- Interest selection
- Location-based services
- Profile search and filtering
- Block/unblock users
- Report profiles

### Matching System
- Advanced swiping algorithm
- Mutual matching detection
- Compatibility scoring
- Super likes (premium feature)
- Match suggestions
- Swipe history

### Real-time Chat
- Instant messaging
- Message status (sent, delivered, read)
- Typing indicators
- Message deletion
- Conversation management
- Unread message counts

### Premium Features
- Subscription management
- Profile boosting
- Super likes
- Advanced filters
- Priority support
- Analytics dashboard

### Gamification
- Points system
- Daily check-ins
- Lucky spin wheel
- Leaderboards
- Level progression
- Rewards system

### Notifications
- Push notifications
- In-app notifications
- Email notifications
- Notification management

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Logging**: Winston
- **Documentation**: Swagger

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   ├── firebase.js          # Firebase configuration
│   │   └── database.js          # Database utilities
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── profileController.js # Profile management
│   │   ├── matchingController.js # Matching algorithm
│   │   ├── chatController.js    # Chat functionality
│   │   ├── premiumController.js # Premium features
│   │   ├── gamificationController.js # Points & rewards
│   │   └── notificationController.js # Notifications
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── validation.js        # Request validation
│   ├── utils/
│   │   ├── helpers.js           # Utility functions
│   │   └── logger.js            # Logging configuration
│   └── index.js                 # Main server file
├── firebase.json                # Firebase configuration
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Database indexes
├── storage.rules                # Storage security rules
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project
- Google Cloud account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Fill in your Firebase credentials and other environment variables:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3000
   NODE_ENV=development
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Download service account key
   - Update environment variables

5. **Deploy Firebase Rules**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/google-login` | Google OAuth login |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| GET | `/auth/me` | Get current user |
| DELETE | `/auth/delete-account` | Delete account |

### Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/photos` | Upload photos |
| GET | `/profile/search` | Search profiles |
| GET | `/profile/:id` | Get profile by ID |

### Matching Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/matching/swipe` | Swipe on profile |
| GET | `/matching/matches` | Get matches |
| GET | `/matching/liked-you` | Get profiles that liked you |
| GET | `/matching/suggestions` | Get match suggestions |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/send` | Send message |
| GET | `/chat/conversations` | Get conversations |
| GET | `/chat/conversations/:id/messages` | Get messages |
| PUT | `/chat/conversations/:id/read` | Mark as read |

## 🔒 Security Features

- **Authentication**: JWT tokens with Firebase Auth
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Joi schema validation
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Firestore Rules**: Database-level security

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring & Logging

- **Winston**: Structured logging
- **Morgan**: HTTP request logging
- **Error Handling**: Centralized error management
- **Health Checks**: Server status monitoring

## 🚀 Deployment

### Firebase Functions (Recommended)

```bash
# Deploy to Firebase Functions
firebase deploy --only functions
```

### Traditional Server

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
FIREBASE_PROJECT_ID=your-production-project-id
# ... other production variables
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized Firestore queries
- **Caching**: Redis for frequently accessed data
- **Compression**: Gzip compression
- **Rate Limiting**: Prevent abuse
- **Connection Pooling**: Efficient database connections

## 🔧 Configuration

### Firebase Configuration
- Firestore security rules
- Storage security rules
- Authentication providers
- Database indexes

### Environment Variables
- Firebase credentials
- JWT secrets
- API keys
- Server configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added premium features
- **v1.2.0** - Enhanced matching algorithm
- **v1.3.0** - Real-time chat implementation

---

**Built with ❤️ for the Desi Dating community**
