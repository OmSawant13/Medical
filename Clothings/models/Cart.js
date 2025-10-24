const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    size: {
        type: String,
        required: true
    },
    color: {
        name: String,
        hex: String
    },
    price: {
        type: Number,
        required: true
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    items: [cartItemSchema],
    sessionId: {
        type: String,
        sparse: true
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        }
    }
}, {
    timestamps: true
});

// Indexes
// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for total items
cartSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total price
cartSchema.virtual('totalPrice').get(function() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity, size, color, price) {
    const Product = require('./Product');

    // Get current product stock from database
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }

    const sizeObj = product.sizes.find(s => s.size === size);
    if (!sizeObj) {
        throw new Error(`Size ${size} not available for this product`);
    }

    const availableStock = sizeObj.stock === null ? 999 : sizeObj.stock;

    const existingItem = this.items.find(item =>
        item.product.toString() === productId.toString() &&
        item.size === size &&
        (item.color && item.color.name === (color && color.name ? color.name : 'Default'))
    );

    if (existingItem) {
        const newTotalQuantity = existingItem.quantity + quantity;
        if (newTotalQuantity > availableStock) {
            throw new Error(`Only ${availableStock} items available in size ${size}. You already have ${existingItem.quantity} in cart.`);
        }
        existingItem.quantity = Math.min(newTotalQuantity, 10);
    } else {
        if (quantity > availableStock) {
            throw new Error(`Only ${availableStock} items available in size ${size}`);
        }
        this.items.push({
            product: productId,
            quantity,
            size,
            color,
            price
        });
    }

    return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, size, color) {
    this.items = this.items.filter(item =>
        !(item.product.toString() === productId.toString() &&
            item.size === size &&
            (item.color && item.color.name === (color && color.name ? color.name : 'Default')))
    );

    return this.save();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = function(productId, size, color, quantity) {
    const item = this.items.find(item =>
        item.product.toString() === productId.toString() &&
        item.size === size &&
        (item.color && item.color.name === (color && color.name ? color.name : 'Default'))
    );

    if (item) {
        if (quantity <= 0) {
            return this.removeItem(productId, size, color);
        } else {
            item.quantity = Math.min(quantity, 10);
        }
    }

    return this.save();
};

// Method to clear cart
cartSchema.methods.clear = function() {
    this.items = [];
    return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);