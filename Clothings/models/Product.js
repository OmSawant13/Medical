const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['mens', 'womens', 'accessories']
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    alt: String
  }],
  sizes: [{
    size: String,
    stock: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  colors: [{
    name: String,
    hex: String,
    stock: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('inStock').get(function() {
  return this.sizes.some(size => size.stock > 0);
});

// Method to update stock
productSchema.methods.updateStock = function(size, color, quantity) {
  const sizeObj = this.sizes.find(s => s.size === size);
  if (sizeObj) {
    sizeObj.stock = Math.max(0, sizeObj.stock - quantity);
  }
  
  if (color) {
    const colorObj = this.colors.find(c => c.name === color);
    if (colorObj) {
      colorObj.stock = Math.max(0, colorObj.stock - quantity);
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
