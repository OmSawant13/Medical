const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: "Vintage Leather Jacket",
    description: "Classic brown leather jacket with vintage styling. Perfect for any occasion.",
    price: 199.99,
    originalPrice: 250,
    category: "mens",
    subcategory: "outerwear",
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=900&fit=crop", alt: "Vintage Leather Jacket" }
    ],
    sizes: [
      { size: "S", stock: 5 },
      { size: "M", stock: 8 },
      { size: "L", stock: 6 },
      { size: "XL", stock: 4 }
    ],
    colors: [
      { name: "Brown", hex: "#8B4513", stock: 10 },
      { name: "Black", hex: "#000000", stock: 8 }
    ],
    tags: ["vintage", "leather", "jacket", "classic"],
    isFeatured: true,
    discount: 20
  },
  {
    name: "Retro Flannel Shirt",
    description: "Soft flannel shirt with vintage pattern. Comfortable and stylish.",
    price: 54.99,
    originalPrice: 70,
    category: "mens",
    subcategory: "shirts",
    images: [
      { url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=900&fit=crop", alt: "Retro Flannel Shirt" }
    ],
    sizes: [
      { size: "S", stock: 10 },
      { size: "M", stock: 12 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 8 }
    ],
    colors: [
      { name: "Red/Black", hex: "#DC143C", stock: 20 },
      { name: "Blue/White", hex: "#4169E1", stock: 18 }
    ],
    tags: ["flannel", "shirt", "retro", "comfortable"],
    isFeatured: false,
    discount: 21
  },
  {
    name: "Vintage Graphic Hoodie",
    description: "Comfortable hoodie with vintage graphic design. Perfect for casual wear.",
    price: 64.99,
    originalPrice: 80,
    category: "mens",
    subcategory: "hoodies",
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=900&fit=crop", alt: "Vintage Graphic Hoodie" }
    ],
    sizes: [
      { size: "S", stock: 7 },
      { size: "M", stock: 9 },
      { size: "L", stock: 11 },
      { size: "XL", stock: 6 }
    ],
    colors: [
      { name: "Black", hex: "#000000", stock: 15 },
      { name: "Gray", hex: "#808080", stock: 12 }
    ],
    tags: ["hoodie", "graphic", "vintage", "casual"],
    isFeatured: false,
    discount: 19
  },
  {
    name: "Vintage Silk Scarf",
    description: "Elegant silk scarf with vintage pattern. Perfect accessory for any outfit.",
    price: 29.99,
    originalPrice: 40,
    category: "womens",
    subcategory: "accessories",
    images: [
      { url: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=900&fit=crop", alt: "Vintage Silk Scarf" }
    ],
    sizes: [
      { size: "One Size", stock: 20 }
    ],
    colors: [
      { name: "Floral", hex: "#FF69B4", stock: 25 },
      { name: "Geometric", hex: "#4B0082", stock: 20 }
    ],
    tags: ["scarf", "silk", "vintage", "elegant"],
    isFeatured: true,
    discount: 25
  },
  {
    name: "Retro Denim Jacket",
    description: "Classic denim jacket with vintage wash. Timeless style for any wardrobe.",
    price: 89.99,
    originalPrice: 129,
    category: "womens",
    subcategory: "outerwear",
    images: [
      { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=900&fit=crop", alt: "Retro Denim Jacket" }
    ],
    sizes: [
      { size: "XS", stock: 6 },
      { size: "S", stock: 8 },
      { size: "M", stock: 10 },
      { size: "L", stock: 7 },
      { size: "XL", stock: 5 }
    ],
    colors: [
      { name: "Light Blue", hex: "#87CEEB", stock: 20 },
      { name: "Dark Blue", hex: "#000080", stock: 18 }
    ],
    tags: ["denim", "jacket", "retro", "classic"],
    isFeatured: true,
    discount: 30
  },
  {
    name: "Vintage Floral Dress",
    description: "Beautiful floral dress with vintage silhouette. Perfect for special occasions.",
    price: 79.99,
    originalPrice: 100,
    category: "womens",
    subcategory: "dresses",
    images: [
      { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=900&fit=crop", alt: "Vintage Floral Dress" }
    ],
    sizes: [
      { size: "XS", stock: 4 },
      { size: "S", stock: 6 },
      { size: "M", stock: 8 },
      { size: "L", stock: 5 },
      { size: "XL", stock: 3 }
    ],
    colors: [
      { name: "Floral Pink", hex: "#FFB6C1", stock: 15 },
      { name: "Floral Blue", hex: "#ADD8E6", stock: 12 }
    ],
    tags: ["dress", "floral", "vintage", "elegant"],
    isFeatured: false,
    discount: 20
  },
  {
    name: "Vintage Leather Watch",
    description: "Classic leather strap watch with vintage styling. Timeless accessory.",
    price: 89.99,
    originalPrice: 112,
    category: "accessories",
    subcategory: "watches",
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=900&fit=crop", alt: "Vintage Leather Watch" }
    ],
    sizes: [
      { size: "One Size", stock: 15 }
    ],
    colors: [
      { name: "Brown Leather", hex: "#8B4513", stock: 20 },
      { name: "Black Leather", hex: "#000000", stock: 18 }
    ],
    tags: ["watch", "leather", "vintage", "classic"],
    isFeatured: false,
    discount: 20
  },
  {
    name: "Retro Sunglasses",
    description: "Stylish retro sunglasses with vintage frames. Perfect for sunny days.",
    price: 49.99,
    originalPrice: 67,
    category: "accessories",
    subcategory: "eyewear",
    images: [
      { url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=900&fit=crop", alt: "Retro Sunglasses" }
    ],
    sizes: [
      { size: "One Size", stock: 25 }
    ],
    colors: [
      { name: "Black", hex: "#000000", stock: 30 },
      { name: "Tortoise", hex: "#8B4513", stock: 25 }
    ],
    tags: ["sunglasses", "retro", "vintage", "style"],
    isFeatured: true,
    discount: 25
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} products`);

    // Display summary
    console.log('\n📊 Database Summary:');
    console.log(`- Total Products: ${products.length}`);
    console.log(`- Featured Products: ${products.filter(p => p.isFeatured).length}`);
    console.log(`- Categories: ${[...new Set(products.map(p => p.category))].join(', ')}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('🚀 Your 8een.store is ready with sample products!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedDatabase();
