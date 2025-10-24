const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// GET /api/cart - Get user's cart (Authentication required)
router.get('/', async(req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required. Please login to view cart.' });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            return res.json({ items: [], totalItems: 0, totalPrice: 0 });
        }

        res.json({
            items: cart.items,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// POST /api/cart/add - Add item to cart
router.post('/add', async(req, res) => {
    try {
        const { userId, productId, quantity, size, color, price } = req.body;

        console.log('Cart add request:', { userId, productId, quantity, size, color });

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required. Please login to add items to cart.' });
        }

        if (!productId || !quantity || !size) {
            console.log('Missing required fields:', { productId, quantity, size });
            return res.status(400).json({ error: 'Product ID, quantity, and size are required' });
        }

        // Get product details
        const product = await Product.findById(productId);
        console.log('Product found:', product ? product.name : 'null');
        if (!product || !product.isActive) {
            console.log('Product not found or inactive:', { product: !!product, isActive: product ? product.isActive : false });
            return res.status(404).json({ error: 'Product not found or not available' });
        }

        // Check stock availability
        const sizeObj = product.sizes.find(s => s.size === size);
        console.log('Size check:', { size, availableSizes: product.sizes.map(s => s.size), sizeObj, stock: sizeObj ? sizeObj.stock : 0 });

        // Handle null stock - if stock is null, assume it's available (infinite stock)
        const availableStock = sizeObj ? (sizeObj.stock === null ? 999 : sizeObj.stock) : 0;

        if (!sizeObj || availableStock < quantity) {
            console.log('Insufficient stock:', { sizeObj: !!sizeObj, stock: availableStock, quantity });
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Find or create cart for authenticated user only
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Add item to cart
        console.log('Adding item to cart:', { productId, quantity, size, color, price });
        try {
            await cart.addItem(productId, quantity, size, color, price);
            console.log('Item added successfully');
            res.json({ message: 'Item added to cart successfully' });
        } catch (addError) {
            console.error('Error in addItem method:', addError);
            if (addError.message.includes('Only') || addError.message.includes('not available')) {
                return res.status(400).json({ error: addError.message });
            }
            throw addError;
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart', details: error.message });
    }
});

// PUT /api/cart/update - Update cart item quantity
router.put('/update', async(req, res) => {
    try {
        const { userId, sessionId, productId, quantity, size, color } = req.body;

        if (!productId || !size) {
            return res.status(400).json({ error: 'Product ID and size are required' });
        }

        // Find cart
        let cart;
        if (userId) {
            cart = await Cart.findOne({ user: userId });
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId });
        } else {
            return res.status(400).json({ error: 'User ID or session ID required' });
        }

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Update quantity
        await cart.updateQuantity(productId, size, color, quantity);

        res.json({ message: 'Cart updated successfully' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// DELETE /api/cart/remove - Remove item from cart
router.delete('/remove', async(req, res) => {
    try {
        const { userId, sessionId, productId, size, color } = req.body;

        if (!productId || !size) {
            return res.status(400).json({ error: 'Product ID and size are required' });
        }

        // Find cart
        let cart;
        if (userId) {
            cart = await Cart.findOne({ user: userId });
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId });
        } else {
            return res.status(400).json({ error: 'User ID or session ID required' });
        }

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Remove item
        await cart.removeItem(productId, size, color);

        res.json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', async(req, res) => {
    try {
        const { userId, sessionId } = req.body;

        // Find cart
        let cart;
        if (userId) {
            cart = await Cart.findOne({ user: userId });
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId });
        } else {
            return res.status(400).json({ error: 'User ID or session ID required' });
        }

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Clear cart
        await cart.clear();

        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// POST /api/cart/merge - Merge session cart with user cart
router.post('/merge', async(req, res) => {
    try {
        const { userId, sessionId } = req.body;

        if (!userId || !sessionId) {
            return res.status(400).json({ error: 'User ID and session ID required' });
        }

        // Find both carts
        const userCart = await Cart.findOne({ user: userId });
        const sessionCart = await Cart.findOne({ sessionId });

        if (!sessionCart || sessionCart.items.length === 0) {
            return res.json({ message: 'No session cart to merge' });
        }

        if (!userCart) {
            // Create new user cart with session items
            const newCart = new Cart({
                user: userId,
                items: sessionCart.items
            });
            await newCart.save();
        } else {
            // Merge session items into user cart
            for (const sessionItem of sessionCart.items) {
                await userCart.addItem(
                    sessionItem.product,
                    sessionItem.quantity,
                    sessionItem.size,
                    sessionItem.color,
                    sessionItem.price
                );
            }
        }

        // Clear session cart
        await sessionCart.clear();

        res.json({ message: 'Cart merged successfully' });
    } catch (error) {
        console.error('Error merging cart:', error);
        res.status(500).json({ error: 'Failed to merge cart' });
    }
});

module.exports = router;