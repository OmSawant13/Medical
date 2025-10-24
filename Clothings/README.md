# 8een.store - Vintage Fashion E-commerce Platform

A modern, production-ready e-commerce website for vintage fashion with MongoDB Atlas integration, Firebase authentication, and a complete backend API.

## 🌟 Features

- **Modern Design**: Clean, responsive UI with vintage aesthetic
- **Firebase Authentication**: Secure user authentication with Google OAuth
- **MongoDB Atlas**: Cloud database for products, users, cart, and orders
- **RESTful API**: Complete backend API for all e-commerce operations
- **Shopping Cart**: Persistent cart with session and user management
- **Order Management**: Complete order processing and tracking
- **Product Management**: Advanced product filtering and search
- **Responsive Design**: Mobile-first approach for all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account
- Firebase project setup

### 1. Clone and Install

```bash
cd /Users/omsawant/Desktop/Clothings
npm install
```

### 2. Environment Setup

Copy the environment example file:
```bash
cp env.example .env
```

Update `.env` with your configuration:
```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/8eenstore?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://8een.store

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Firebase Configuration (for frontend auth)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

### 3. MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGODB_URI` in `.env`

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication and Google sign-in
4. Get your Firebase config and update the `.env` file
5. Add your domain to authorized domains

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
8een.store/
├── models/                 # MongoDB models
│   ├── Product.js         # Product schema
│   ├── User.js            # User schema
│   ├── Cart.js            # Cart schema
│   └── Order.js           # Order schema
├── routes/                 # API routes
│   ├── products.js        # Product endpoints
│   ├── users.js           # User endpoints
│   ├── cart.js            # Cart endpoints
│   └── orders.js          # Order endpoints
├── static/                 # Static files (if needed)
├── server.js              # Main server file
├── package.json           # Dependencies
├── env.example            # Environment template
└── *.html                 # Frontend pages
```

## 🔧 API Endpoints

### Products
- `GET /api/products` - Get all products with filtering
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get product categories
- `GET /api/products/:id` - Get single product
- `POST /api/products/:id/review` - Add product review

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/firebase` - Firebase authentication
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:orderNumber` - Get single order
- `PUT /api/orders/:orderNumber/cancel` - Cancel order

## 🎨 Frontend Integration

The HTML files are already configured with Firebase authentication. To connect with the backend API:

1. Update the Firebase configuration in each HTML file
2. Add API calls to the backend endpoints
3. Implement cart functionality with the API
4. Add order processing with the API

## 🚀 Deployment

### For Production Deployment:

1. **Environment Variables**: Set all environment variables in your hosting platform
2. **MongoDB Atlas**: Ensure your cluster is production-ready
3. **Firebase**: Configure production Firebase project
4. **Domain**: Update `FRONTEND_URL` to your actual domain
5. **SSL**: Ensure HTTPS is enabled
6. **Security**: Review and update security settings

### Recommended Hosting Platforms:
- **Vercel** (for frontend)
- **Railway** (for backend)
- **Heroku** (for backend)
- **DigitalOcean** (for full-stack)

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQL injection protection

## 📱 Mobile Responsive

All pages are fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🛠️ Development

### Adding New Features:
1. Create new models in `models/`
2. Add routes in `routes/`
3. Update frontend HTML files
4. Test with the API endpoints

### Database Seeding:
You can add sample products by creating a seed script or using the API endpoints.

## 📞 Support

For support with 8een.store setup:
1. Check the environment configuration
2. Verify MongoDB Atlas connection
3. Ensure Firebase is properly configured
4. Check server logs for errors

## 🎯 Next Steps

1. **Customize Products**: Add your actual product data
2. **Payment Integration**: Add Stripe or PayPal
3. **Email Notifications**: Add order confirmation emails
4. **Admin Panel**: Create admin interface for product management
5. **Analytics**: Add Google Analytics or similar
6. **SEO**: Optimize for search engines

---

**8een.store** - Vintage Vibes, Modern Style 🎨
