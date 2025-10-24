const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products/:id - Get single product by ID
router.get('/:id', async(req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// GET /api/products - Get all products with filtering and pagination
router.get('/', async(req, res) => {
    try {
        const {
            page = 1,
                limit = 12,
                category,
                minPrice,
                maxPrice,
                search,
                sort = 'createdAt',
                order = 'desc',
                featured,
                inStock
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        if (search) {
            filter.$text = { $search: search };
        }

        if (featured === 'true') {
            filter.isFeatured = true;
        }

        if (inStock === 'true') {
            filter['sizes.stock'] = { $gt: 0 };
        }

        // Build sort object
        const sortObj = {};
        sortObj[sort] = order === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const products = await Product.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('reviews.userId', 'firstName lastName')
            .lean();

        const total = await Product.countDocuments(filter);

        res.json({
            products,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async(req, res) => {
    try {
        const products = await Product.find({
                isActive: true,
                isFeatured: true
            })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();

        res.json(products);
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
});

// GET /api/products/categories - Get product categories
router.get('/categories', async(req, res) => {
    try {
        const categories = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async(req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('reviews.userId', 'firstName lastName')
            .lean();

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (!product.isActive) {
            return res.status(404).json({ error: 'Product not available' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', async(req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 12, sort = 'createdAt', order = 'desc' } = req.query;

        const filter = {
            isActive: true,
            category: category
        };

        const sortObj = {};
        sortObj[sort] = order === 'desc' ? -1 : 1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Product.countDocuments(filter);

        res.json({
            products,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /api/products/:id/review - Add product review
router.post('/:id/review', async(req, res) => {
    try {
        const { rating, comment, userId } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if user already reviewed this product
        const existingReview = product.reviews.find(
            review => review.userId.toString() === userId
        );

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        // Add review
        product.reviews.push({
            userId,
            rating: parseInt(rating),
            comment: comment || ''
        });

        // Update average rating
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.rating.average = totalRating / product.reviews.length;
        product.rating.count = product.reviews.length;

        await product.save();

        res.json({ message: 'Review added successfully' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// POST /api/products - Create new product (Admin only)
router.post('/', async(req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            sizes,
            colors,
            images,
            isFeatured,
            stock
        } = req.body;

        // Validate required fields
        if (!name || !description || !price || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create product
        const product = new Product({
            name,
            description,
            price,
            originalPrice: originalPrice || null,
            category,
            sizes: sizes || [],
            colors: colors || [],
            images: images || [],
            isFeatured: isFeatured || false,
            stock: stock || 1,
            isActive: true
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', async(req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', async(req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;