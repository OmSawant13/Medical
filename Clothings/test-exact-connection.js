const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://8eenstore_db_user:qFmOe3zWbFo3OdVT@store.68fmmoj.mongodb.net/?retryWrites=true&w=majority&appName=store";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        console.log('🔍 Testing your exact MongoDB Atlas connection...');
        console.log('📋 Connection String:', uri);

        // Connect the client to the server
        console.log('⏳ Connecting...');
        await client.connect();

        // Send a ping to confirm successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Pinged your deployment. You successfully connected to MongoDB Atlas!");

        // Test database operations
        const db = client.db("8eenstore");
        const collections = await db.listCollections().toArray();
        console.log('📄 Collections in 8eenstore:', collections.map(c => c.name));

        console.log('\n🎉 SUCCESS! Your MongoDB Atlas is working perfectly!');
        console.log('🚀 Next steps:');
        console.log('1. Update your .env file with this connection string');
        console.log('2. Run: node seed-products.js');
        console.log('3. Start your server: npm start');

    } catch (error) {
        console.error("❌ Connection failed:", error.message);

        if (error.message.includes('authentication failed')) {
            console.log('\n🔧 Authentication Issue:');
            console.log('1. Check your username: 8eenstore_db_user');
            console.log('2. Check your password: qFmOe3zWbFo3OdVT');
            console.log('3. Make sure the user has proper permissions');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 Network Issue:');
            console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
            console.log('2. Go to Network Access → Add IP Address');
        }

    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

