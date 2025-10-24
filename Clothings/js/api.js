// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Helper Functions
class StoreAPI {
    static async fetchProducts(category = null, featured = false) {
        try {
            let url = `${API_BASE_URL}/products`;
            if (featured) {
                url = `${API_BASE_URL}/products/featured`;
            } else if (category) {
                url = `${API_BASE_URL}/products/category/${category}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch products');

            const data = await response.json();
            return featured ? data : data.products || data;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    static async fetchProductById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`);
            if (!response.ok) throw new Error('Failed to fetch product');
            return await response.json();
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    }

    static async addToCart(productId, quantity, size, color, price, userId = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    quantity,
                    size,
                    color,
                    price,
                    userId
                })
            });

            if (!response.ok) throw new Error('Failed to add to cart');
            return await response.json();
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { error: error.message };
        }
    }

    static async getCart(userId = null, sessionId = null) {
            try {
                const response = await fetch(`${API_BASE_URL}/cart?${userId ? `userId=${userId}` : `sessionId=${sessionId}`}`);
            if (!response.ok) throw new Error('Failed to fetch cart');
            return await response.json();
        } catch (error) {
            console.error('Error fetching cart:', error);
            return { items: [], totalItems: 0, totalPrice: 0 };
        }
    }

    static async updateCartItem(productId, size, color, quantity, userId = null, sessionId = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/cart/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    size,
                    color,
                    quantity,
                    userId,
                    sessionId
                })
            });
            
            if (!response.ok) throw new Error('Failed to update cart');
            return await response.json();
        } catch (error) {
            console.error('Error updating cart:', error);
            return { error: error.message };
        }
    }

    static async removeFromCart(productId, size, color, userId = null, sessionId = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/cart/remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    size,
                    color,
                    userId,
                    sessionId
                })
            });
            
            if (!response.ok) throw new Error('Failed to remove from cart');
            return await response.json();
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { error: error.message };
        }
    }

    static async createOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) throw new Error('Failed to create order');
            return await response.json();
        } catch (error) {
            console.error('Error creating order:', error);
            return { error: error.message };
        }
    }
}

// Product Card Component
function createProductCard(product) {
    const discountPercentage = product.originalPrice && product.originalPrice > product.price 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const sizes = product.sizes.map(size => size.size).join(', ');
    const colors = product.colors.map(color => color.name).join(', ');

    return `
        <div class="product-card" data-product-id="${product._id}" style="width: 380px; margin: 0 auto; cursor: pointer;" onclick="viewProduct('${product._id}')">
            <div class="product-image" style="height: 300px; overflow: hidden; position: relative; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                ${product.isFeatured ? '<span class="badge featured-badge" style="position: absolute; top: 12px; left: 12px; background: #28a745; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; font-weight: 600;">Featured</span>' : ''}
                ${discountPercentage > 0 ? `<span class="badge discount-badge" style="position: absolute; top: 12px; right: 12px; background: #dc3545; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; font-weight: 600;">-${discountPercentage}%</span>` : ''}
                <img src="${product.images && product.images.length > 0 ? product.images[0].url : 'https://picsum.photos/400/300?random=1'}"
                     alt="${product.images && product.images.length > 0 ? product.images[0].alt : product.name}"
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.src='https://picsum.photos/400/300?random=1'">
            </div>
            <div class="product-info" style="padding: 24px;">
                <h3 class="product-name" style="font-size: 1.25rem; margin-bottom: 12px; font-weight: 600; color: #333;">${product.name}</h3>
                <div class="product-price" style="margin-bottom: 16px;">
                    <span class="current-price" style="font-size: 1.5rem; font-weight: 700; color: #000;">₹${product.price}</span>
                    ${product.originalPrice ? `<span class="original-price" style="font-size: 1.1rem; color: #999; text-decoration: line-through; margin-left: 12px;">₹${product.originalPrice}</span>` : ''}
                </div>
                <div class="product-description" style="font-size: 0.95rem; color: #666; margin-bottom: 16px; line-height: 1.4; height: 2.8rem; overflow: hidden;">${product.description}</div>
                <div class="product-details" style="margin-bottom: 16px;">
                    <div class="sizes" style="font-size: 0.9rem; color: #888; margin-bottom: 8px;">
                        <strong>Sizes:</strong> ${product.sizes.map(s => s.size).join(', ')}
                    </div>
                    <div class="colors" style="font-size: 0.9rem; color: #888;">
                        <strong>Colors:</strong> ${product.colors.map(c => c.name).join(', ')}
                    </div>
                </div>
                <div class="size-selector" style="margin-bottom: 16px;">
                    ${product.sizes.slice(0, 4).map(size => 
                        `<button class="size-btn" data-size="${size.size}" onclick="event.stopPropagation(); selectSize(this)" style="padding: 8px 16px; margin: 4px; border: 1px solid #e5e5e5; background: white; border-radius: 4px; font-size: 0.9rem; cursor: pointer; transition: all 0.3s;">${size.size}</button>`
                    ).join('')}
                </div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product._id}', '${product.name}', ${product.price})" style="width: 100%; padding: 12px; background: #000; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;">
                    🛒 Add to Cart
                </button>
            </div>
        </div>
    `;
}

// View Product Function
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Load Products Function
async function loadProducts(category = null, containerId = 'products-grid') {
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        // Show loading state
        container.innerHTML = '<div class="loading">Loading products...</div>';

        // Fetch products from API
        const products = await StoreAPI.fetchProducts(category);
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <h3>No products found</h3>
                    <p>${category ? `No ${category} products available.` : 'No products available at the moment.'}</p>
                    <p>Check back soon for new arrivals!</p>
                </div>
            `;
            return;
        }

        // Generate product cards
        const productCards = products.map(product => createProductCard(product)).join('');
        container.innerHTML = productCards;

        // Update product count
        const countElement = document.querySelector('.product-count');
        if (countElement) {
            countElement.textContent = `${products.length} products found`;
        }

        // Initialize size selectors
        initializeSizeSelectors();
        
    } catch (error) {
        console.error('Error loading products:', error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <h3>Error loading products</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }
}

// Load Featured Products
async function loadFeaturedProducts() {
    try {
        const products = await StoreAPI.fetchProducts(null, true);
        const container = document.getElementById('featured-products');
        
        if (container && products.length > 0) {
            const productCards = products.map(product => createProductCard(product)).join('');
            container.innerHTML = productCards;
            initializeSizeSelectors();
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

// Initialize Size Selectors
function initializeSizeSelectors() {
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove selected class from siblings
            this.parentElement.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
        });
    });
}

// Update Quantity
function updateQuantity(btn, change) {
    const qtyDisplay = btn.parentElement.querySelector('.qty-value');
    let currentQty = parseInt(qtyDisplay.textContent);
    const newQty = Math.max(1, currentQty + change);
    qtyDisplay.textContent = newQty;
}

// Select Size
function selectSize(button) {
    // Remove selected class from all size buttons in this product card
    const productCard = button.closest('.product-card');
    const allSizeButtons = productCard.querySelectorAll('.size-btn');
    allSizeButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.style.background = 'white';
        btn.style.color = '#000';
    });
    
    // Add selected class to clicked button
    button.classList.add('selected');
    button.style.background = '#000';
    button.style.color = 'white';
}

// Add to Cart
async function addToCart(productId, productName, price) {
    try {
        // Check if user is authenticated
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        
        if (!userId || !userEmail) {
            // User not authenticated, redirect to login
            alert('Please login to add items to cart');
            window.location.href = '/login.html';
            return;
        }

        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        
        // Get selected size (default to first available size if none selected)
        let selectedSize = productCard.querySelector('.size-btn.selected');
        if (!selectedSize) {
            selectedSize = productCard.querySelector('.size-btn');
            if (selectedSize) {
                selectedSize.classList.add('selected');
            }
        }
        
        // Get quantity (default to 1 if not found)
        let quantity = 1;
        const qtyElement = productCard.querySelector('.qty-value');
        if (qtyElement) {
            quantity = parseInt(qtyElement.textContent) || 1;
        }
        
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }

        const size = selectedSize.dataset.size;
        const color = { name: 'Default', hex: '#000000' }; // Default color object since we're not showing color selection in current cards

        console.log('Adding to cart:', { productId, quantity, size, color, price, userId });
        const result = await StoreAPI.addToCart(productId, quantity, size, color, price, userId);
        
        if (result.error) {
            alert('Error adding to cart: ' + result.error);
        } else {
            // Show success message
            const addBtn = productCard.querySelector('.add-to-cart');
            const originalText = addBtn.innerHTML;
            addBtn.innerHTML = '✓ Added to Cart';
            addBtn.style.background = '#16a34a';
            
            setTimeout(() => {
                addBtn.innerHTML = originalText;
                addBtn.style.background = '#000';
            }, 2000);

            // Show cart notification
            showCartNotification();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding to cart. Please try again.');
    }
}

// Show cart notification
function showCartNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = '✓ Added to cart! <a href="cart.html" style="color: white; text-decoration: underline;">View Cart</a>';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize page based on current page
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('allproduct.html')) {
        loadProducts(null, 'products-grid');
    } else if (currentPage.includes('Mens.html')) {
        loadProducts('mens', 'product-grid');
    } else if (currentPage.includes('Womens.html')) {
        loadProducts('womens', 'product-grid');
    } else if (currentPage.includes('Accessories.html')) {
        loadProducts('accessories', 'product-grid');
    } else if (currentPage.includes('landing.html')) {
        loadFeaturedProducts();
    }
    
    // Check authentication status
    checkAuthStatus();
});

// Check Authentication Status
function checkAuthStatus() {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userId && userEmail) {
        // User is authenticated
        updateNavigationForAuth(true);
        return true;
    } else {
        // User is not authenticated
        updateNavigationForAuth(false);
        return false;
    }
}

// Update Navigation Based on Auth Status
function updateNavigationForAuth(isAuthenticated) {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (isAuthenticated) {
        const userEmail = localStorage.getItem('userEmail');
        authButtons.innerHTML = `
            <a href="dashboard.html" class="btn btn-outline">My Account</a>
            <button onclick="logout()" class="btn btn-primary">Logout</button>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="login.html" class="btn btn-outline">Sign In</a>
            <a href="signup.html" class="btn btn-primary">Sign Up</a>
        `;
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    alert('Logged out successfully!');
    window.location.reload();
}