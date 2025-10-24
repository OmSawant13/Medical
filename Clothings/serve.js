// Simple HTTP server to serve HTML files locally
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve uploaded images
app.use('/api/images', express.static(path.join(__dirname, 'uploads')));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'search.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/mens', (req, res) => {
    res.sendFile(path.join(__dirname, 'Mens.html'));
});

app.get('/womens', (req, res) => {
    res.sendFile(path.join(__dirname, 'Womens.html'));
});

app.get('/accessories', (req, res) => {
    res.sendFile(path.join(__dirname, 'Accessories.html'));
});

app.get('/allproducts', (req, res) => {
    res.sendFile(path.join(__dirname, 'allproduct.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🌐 8EEN STORE frontend server running on http://localhost:${PORT}`);
    console.log(`📱 Open your website: http://localhost:${PORT}`);
    console.log(`🔧 Admin panel: http://localhost:${PORT}/admin`);
});