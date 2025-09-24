const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const key_id = 'rzp_live_RKfEnx3YhLfVPj';
const key_secret: 'VyGHCPRw9wW1hFTyIMpAdKLZ';

// Create Razorpay order with UPI support
app.post("/create-order", async (req, res) => {
  const { amount, currency = "INR", receipt = "receipt_001", notes = {} } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paise, round for safety
      currency,
      receipt,
      payment_capture: 1, // auto-capture after payment
      notes: {
        ...notes,
        created_at: new Date().toISOString(),
        platform: "react-native-expo"
      }
    });

    res.json({
      success: true,
      orderId: order.id,
      currency: order.currency,
      amount: order.amount / 100, // send back in rupees for frontend clarity
      key: key_id,
      createdAt: order.created_at
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: error.error ? error.error.description : error.message
    });
  }
});


// Enhanced payment verification with UPI support
app.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required payment parameters" 
      });
    }

    // Generate signature for verification
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Fetch payment details for additional verification (especially for UPI)
      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        // Check payment status
        if (payment.status === 'captured' || payment.status === 'authorized') {
          return res.json({ 
            success: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paymentStatus: payment.status,
            paymentMethod: payment.method,
            amount: payment.amount / 100 // Convert back to rupees
          });
        } else {
          return res.status(400).json({ 
            success: false, 
            message: `Payment status: ${payment.status}`,
            paymentStatus: payment.status
          });
        }
      } catch (fetchError) {
        // If we can't fetch payment details, still trust the signature verification
        console.warn('Could not fetch payment details, but signature is valid:', fetchError);
        return res.json({ 
          success: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          paymentStatus: 'verified_by_signature'
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid signature",
        details: "Signature verification failed"
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Payment verification failed",
      error: error.message 
    });
  }
});

// Get payment status endpoint
app.get("/payment-status/:paymentId", async (req, res) => {
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);
    res.json({
      paymentId: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount / 100,
      currency: payment.currency,
      createdAt: payment.created_at,
      captured: payment.captured
    });
  } catch (error) {
    console.error("Payment status fetch error:", error);
    res.status(500).json({ 
      message: "Failed to fetch payment status",
      error: error.error ? error.error.description : error.message 
    });
  }
});

// Webhook endpoint for UPI payment notifications (recommended)
app.post("/webhook", express.raw({ type: 'application/json' }), (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body; // raw buffer

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (signature === expectedSignature) {
    const event = JSON.parse(body.toString()); // safe parse
    console.log("Webhook received:", event.event, event.payload.payment.entity.id);
    res.json({ status: "success" });
  } else {
    return res.status(400).json({ status: "invalid signature" });
  }
});


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "razorpay-backend"
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
