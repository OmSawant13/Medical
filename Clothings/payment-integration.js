// Payment Gateway Integration Examples for 8een.store
// This file shows how to integrate real payment gateways

// ========================================
// STRIPE INTEGRATION (Most Popular)
// ========================================

// Frontend Integration
const stripe = Stripe('pk_test_your_stripe_publishable_key');
const elements = stripe.elements();

// Create payment form
const cardElement = elements.create('card', {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
    },
});

cardElement.mount('#card-element');

// Handle payment submission
async function processStripePayment(orderData) {
    try {
        const { token, error } = await stripe.createToken(cardElement);

        if (error) {
            throw new Error(error.message);
        }

        const response = await fetch('/api/payments/stripe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token.id,
                amount: orderData.total * 100, // Convert to paise
                currency: 'inr',
                orderId: orderData.orderNumber
            })
        });

        const result = await response.json();

        if (result.success) {
            // Payment successful
            window.location.href = 'order-success.html?order=' + orderData.orderNumber;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
    }
}

// ========================================
// RAZORPAY INTEGRATION (India)
// ========================================

const razorpay = new Razorpay({
    key: 'rzp_test_your_razorpay_key',
    currency: 'INR'
});

async function processRazorpayPayment(orderData) {
    try {
        const options = {
            amount: orderData.total * 100, // Convert to paise
            currency: 'INR',
            receipt: orderData.orderNumber,
            payment_capture: 1,
            name: '8een.store',
            description: 'Vintage Fashion Purchase',
            prefill: {
                name: orderData.customerName,
                email: orderData.customerEmail,
                contact: orderData.customerPhone
            },
            notes: {
                order_id: orderData.orderNumber
            }
        };

        const payment = await razorpay.createPayment(options);

        razorpay.on('payment.success', function(payment) {
            // Payment successful
            window.location.href = 'order-success.html?order=' + orderData.orderNumber;
        });

        razorpay.on('payment.error', function(error) {
            alert('Payment failed: ' + error.error.description);
        });

    } catch (error) {
        console.error('Razorpay error:', error);
        alert('Payment failed: ' + error.message);
    }
}

// ========================================
// PAYPAL INTEGRATION
// ========================================

async function processPayPalPayment(orderData) {
    try {
        const response = await fetch('/api/payments/paypal/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: orderData.total,
                currency: 'INR',
                orderId: orderData.orderNumber,
                returnUrl: window.location.origin + '/order-success.html',
                cancelUrl: window.location.origin + '/checkout.html'
            })
        });

        const result = await response.json();

        if (result.approvalUrl) {
            // Redirect to PayPal
            window.location.href = result.approvalUrl;
        } else {
            throw new Error('Failed to create PayPal payment');
        }
    } catch (error) {
        console.error('PayPal error:', error);
        alert('Payment failed: ' + error.message);
    }
}

// ========================================
// BACKEND PAYMENT PROCESSING
// ========================================

// Add to your server.js or create payment routes
const express = require('express');
const stripe = require('stripe')('sk_test_your_stripe_secret_key');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: 'rzp_test_your_razorpay_key',
    key_secret: 'your_razorpay_secret'
});

// Stripe payment processing
app.post('/api/payments/stripe', async(req, res) => {
    try {
        const { token, amount, currency, orderId } = req.body;

        const charge = await stripe.charges.create({
            amount: amount,
            currency: currency,
            source: token,
            description: `Order ${orderId} - 8een.store`
        });

        // Update order status in database
        await Order.findOneAndUpdate({ orderNumber: orderId }, {
            'payment.status': 'completed',
            'payment.transactionId': charge.id,
            'payment.method': 'stripe'
        });

        res.json({ success: true, transactionId: charge.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Razorpay payment verification
app.post('/api/payments/razorpay/verify', async(req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', 'your_razorpay_secret')
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified
            await Order.findOneAndUpdate({ orderNumber: req.body.orderId }, {
                'payment.status': 'completed',
                'payment.transactionId': razorpay_payment_id,
                'payment.method': 'razorpay'
            });

            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// PAYMENT METHOD SELECTION
// ========================================

function initializePaymentGateway() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    switch (paymentMethod) {
        case 'stripe':
            processStripePayment(orderData);
            break;
        case 'razorpay':
            processRazorpayPayment(orderData);
            break;
        case 'paypal':
            processPayPalPayment(orderData);
            break;
        case 'cod':
            // Cash on Delivery - no payment processing needed
            window.location.href = 'order-success.html?order=' + orderData.orderNumber;
            break;
        default:
            alert('Please select a payment method');
    }
}

// ========================================
// ENVIRONMENT VARIABLES SETUP
// ========================================

/*
Add to your .env file:

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production

# Payment Settings
DEFAULT_CURRENCY=INR
PAYMENT_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook
*/

// ========================================
// SECURITY BEST PRACTICES
// ========================================

// 1. Never expose secret keys in frontend
// 2. Always verify payments on backend
// 3. Use HTTPS in production
// 4. Implement webhook verification
// 5. Log all payment attempts
// 6. Handle payment failures gracefully
// 7. Store payment data securely
// 8. Implement rate limiting
// 9. Validate all payment data
// 10. Use PCI DSS compliant hosting

module.exports = {
    processStripePayment,
    processRazorpayPayment,
    processPayPalPayment,
    initializePaymentGateway
};