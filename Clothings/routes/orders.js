const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// POST /api/orders - Create new order
router.post('/', verifyToken, async(req, res) => {
    try {
        const {
            shippingAddress,
            billingAddress,
            paymentMethod,
            cartItems
        } = req.body;

        if (!shippingAddress || !billingAddress || !paymentMethod || !cartItems) {
            return res.status(400).json({ error: 'Missing required order information' });
        }

        // Calculate pricing
        let subtotal = 0;
        const items = [];

        for (const cartItem of cartItems) {
            const product = await Product.findById(cartItem.product);
            if (!product || !product.isActive) {
                return res.status(400).json({ error: `Product ${cartItem.name} is not available` });
            }

            // Check stock
            const sizeObj = product.sizes.find(s => s.size === cartItem.size);
            if (!sizeObj || sizeObj.stock < cartItem.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${cartItem.name}` });
            }

            const itemTotal = product.price * cartItem.quantity;
            subtotal += itemTotal;

            items.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                size: cartItem.size,
                color: cartItem.color,
                image: product.images[0] || { url: '', alt: product.name }
            });
        }

        // Calculate shipping (free over ₹500)
        const shipping = subtotal >= 500 ? 0 : 50;

        // Calculate tax (18% GST for India)
        const tax = subtotal * 0.18;

        const total = subtotal + shipping + tax;

        // Create order
        const order = new Order({
            user: req.userId,
            items,
            shippingAddress,
            billingAddress,
            pricing: {
                subtotal,
                shipping,
                tax,
                total
            },
            payment: {
                method: paymentMethod,
                status: 'pending'
            },
            status: 'pending'
        });

        // Add to timeline
        order.timeline.push({
            status: 'pending',
            note: 'Order placed'
        });

        await order.save();

        // Update product stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { 'sizes.$[elem].stock': -item.quantity }
            }, {
                arrayFilters: [{ 'elem.size': item.size }]
            });
        }

        // Clear user's cart
        await Cart.findOneAndUpdate({ user: req.userId }, { items: [] });

        res.status(201).json({
            message: 'Order created successfully',
            order: {
                orderNumber: order.orderNumber,
                total: order.pricing.total,
                status: order.status
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// GET /api/orders - Get user's orders
router.get('/', verifyToken, async(req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const filter = { user: req.userId };
        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Order.countDocuments(filter);

        res.json({
            orders,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:orderNumber - Get single order
router.get('/:orderNumber', verifyToken, async(req, res) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber,
            user: req.userId
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PUT /api/orders/:orderNumber/cancel - Cancel order
router.put('/:orderNumber/cancel', verifyToken, async(req, res) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber,
            user: req.userId
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ error: 'Order cannot be cancelled' });
        }

        await order.updateStatus('cancelled', 'Order cancelled by customer');

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { 'sizes.$[elem].stock': item.quantity }
            }, {
                arrayFilters: [{ 'elem.size': item.size }]
            });
        }

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

// GET /api/orders/:orderNumber/tracking - Get order tracking
router.get('/:orderNumber/tracking', verifyToken, async(req, res) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber,
            user: req.userId
        }).select('tracking timeline status');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            tracking: order.tracking,
            timeline: order.timeline,
            status: order.status,
            statusDisplay: order.statusDisplay
        });
    } catch (error) {
        console.error('Error fetching tracking:', error);
        res.status(500).json({ error: 'Failed to fetch tracking information' });
    }
});

// GET /api/orders - Get all orders (Admin only)
router.get('/', async(req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'email firstName lastName')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// PUT /api/orders/:orderId/status - Update order status (Admin only)
router.put('/:orderId/status', async(req, res) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order status
        order.status = status;

        // Add to timeline
        order.timeline.push({
            status: status,
            note: `Order status updated to ${status}`,
            timestamp: new Date()
        });

        await order.save();

        res.json({
            message: 'Order status updated successfully',
            order: {
                orderNumber: order.orderNumber,
                status: order.status,
                timeline: order.timeline
            }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;