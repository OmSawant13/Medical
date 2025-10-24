# MongoDB Atlas Setup Guide for 8een.store

## 🔧 Current Issue
The MongoDB Atlas connection is failing with DNS resolution error. Here's how to fix it:

## 📋 Step-by-Step Setup

### 1. MongoDB Atlas Cluster Setup

1. **Go to [MongoDB Atlas](https://cloud.mongodb.com)**
2. **Sign in to your account**
3. **Create a new cluster** (if not already done):
   - Choose **M0 Sandbox** (Free tier)
   - Select **AWS** as provider
   - Choose **US East (N. Virginia)** region
   - Click **Create Cluster**

### 2. Database User Setup

1. **Go to Database Access** in the left sidebar
2. **Click "Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `8eenstore_db_user`
5. **Password**: `qFmOe3zWpFO3a6Vt` (or generate a new one)
6. **Database User Privileges**: Read and write to any database
7. **Click "Add User"**

### 3. Network Access (IP Whitelist)

1. **Go to Network Access** in the left sidebar
2. **Click "Add IP Address"**
3. **Choose "Add Current IP Address"** (recommended)
4. **OR** Add `0.0.0.0/0` for development (less secure)
5. **Click "Confirm"**

### 4. Get Connection String

1. **Go to "Clusters"** in the left sidebar
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Driver**: Node.js
5. **Version**: 4.1 or later
6. **Copy the connection string**

### 5. Update Connection String

Your connection string should look like:
```
mongodb+srv://8eenstore_db_user:<password>@8een.csgumuq.mongodb.net/?retryWrites=true&w=majority
```

Replace `<password>` with your actual password and add the database name:
```
mongodb+srv://8eenstore_db_user:qFmOe3zWpFO3a6Vt@8een.csgumuq.mongodb.net/8eenstore?retryWrites=true&w=majority
```

### 6. Test Connection

Run this command to test the connection:
```bash
node test-connection.js
```

## 🚨 Common Issues & Solutions

### Issue 1: "querySrv ECONNREFUSED"
**Solution**: 
- Check if your cluster is running
- Verify IP whitelist includes your current IP
- Ensure the cluster is in the correct region

### Issue 2: "Authentication failed"
**Solution**:
- Double-check username and password
- Ensure user has proper permissions
- Try creating a new database user

### Issue 3: "Network timeout"
**Solution**:
- Add your IP to the whitelist
- Check firewall settings
- Try connecting from a different network

## 🔄 Alternative: Local MongoDB

If Atlas continues to have issues, you can use a local MongoDB instance:

1. **Install MongoDB locally**:
   ```bash
   # macOS
   brew install mongodb-community
   
   # Start MongoDB
   brew services start mongodb-community
   ```

2. **Update .env file**:
   ```
   MONGODB_URI=mongodb://localhost:27017/8eenstore
   ```

## ✅ Verification

Once connected successfully, you should see:
```
✅ Successfully connected to MongoDB Atlas!
📊 Database info:
- Host: 8een-shard-00-00.xxxxx.mongodb.net
- Port: 27017
- Database: 8eenstore
```

## 🎯 Next Steps

After successful connection:
1. Run `node seed-products.js` to populate with sample data
2. Start your server with `npm start`
3. Test the API endpoints
4. Deploy to production

## 📞 Need Help?

If you're still having issues:
1. Check MongoDB Atlas status page
2. Verify your cluster is not paused
3. Try creating a new cluster in a different region
4. Contact MongoDB Atlas support

---

**Your 8een.store database is almost ready! 🚀**
