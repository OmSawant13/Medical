/**
 * Script to clear rate limit data
 * Run this if you're still getting rate limit errors
 */

const requestStore = new Map();

// Clear the store
requestStore.clear();
console.log('✅ Rate limit store cleared');

// Also clear any Node.js module cache
if (require.cache) {
  const rateLimiterPath = require.resolve('./middleware/rateLimiter');
  if (require.cache[rateLimiterPath]) {
    delete require.cache[rateLimiterPath];
    console.log('✅ Rate limiter module cache cleared');
  }
}

console.log('💡 Now restart your backend server: npm start');

