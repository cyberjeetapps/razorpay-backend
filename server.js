// const express = require("express");
// const Razorpay = require("razorpay");
// const cors = require("cors");
// const crypto = require("crypto");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const razorpay = new Razorpay({
//   key_id: 'rzp_live_RKCoTHZNLRXSb9',
//   key_secret: 'l1Ftg87E3Y10SWW4uO4Mcmo4',
// });

// // Create Razorpay order with UPI support
// app.post("/create-order", async (req, res) => {
//   const { amount, currency = "INR", receipt = "receipt_001", notes = {} } = req.body;

//   try {
//     const order = await razorpay.orders.create({
//       amount: Math.round(amount * 100), // convert to paise, round for safety
//       currency,
//       receipt,
//       payment_capture: 1, // auto-capture after payment
//       notes: {
//         ...notes,
//         created_at: new Date().toISOString(),
//         platform: "react-native-expo"
//       }
//     });

//     res.json({
//       success: true,
//       orderId: order.id,
//       currency: order.currency,
//       amount: order.amount / 100, // send back in rupees for frontend clarity
//       key: razorpay.key_id,
//       createdAt: order.created_at
//     });
//   } catch (error) {
//     console.error("Order creation failed:", error);
//     res.status(500).json({
//       success: false,
//       message: "Order creation failed",
//       error: error.error ? error.error.description : error.message
//     });
//   }
// });


// // Enhanced payment verification with UPI support
// app.post("/verify-payment", async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//   try {
//     // Validate required fields
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Missing required payment parameters" 
//       });
//     }

//     // Generate signature for verification
//     const generated_signature = crypto
//       .createHmac("sha256", razorpay.key_secret)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generated_signature === razorpay_signature) {
//       // Fetch payment details for additional verification (especially for UPI)
//       try {
//         const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
//         // Check payment status
//         if (payment.status === 'captured' || payment.status === 'authorized') {
//           return res.json({ 
//             success: true,
//             paymentId: razorpay_payment_id,
//             orderId: razorpay_order_id,
//             paymentStatus: payment.status,
//             paymentMethod: payment.method,
//             amount: payment.amount / 100 // Convert back to rupees
//           });
//         } else {
//           return res.status(400).json({ 
//             success: false, 
//             message: `Payment status: ${payment.status}`,
//             paymentStatus: payment.status
//           });
//         }
//       } catch (fetchError) {
//         // If we can't fetch payment details, still trust the signature verification
//         console.warn('Could not fetch payment details, but signature is valid:', fetchError);
//         return res.json({ 
//           success: true,
//           paymentId: razorpay_payment_id,
//           orderId: razorpay_order_id,
//           paymentStatus: 'verified_by_signature'
//         });
//       }
//     } else {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid signature",
//         details: "Signature verification failed"
//       });
//     }
//   } catch (error) {
//     console.error("Payment verification error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Payment verification failed",
//       error: error.message 
//     });
//   }
// });

// // Get payment status endpoint
// app.get("/payment-status/:paymentId", async (req, res) => {
//   try {
//     const payment = await razorpay.payments.fetch(req.params.paymentId);
//     res.json({
//       paymentId: payment.id,
//       status: payment.status,
//       method: payment.method,
//       amount: payment.amount / 100,
//       currency: payment.currency,
//       createdAt: payment.created_at,
//       captured: payment.captured
//     });
//   } catch (error) {
//     console.error("Payment status fetch error:", error);
//     res.status(500).json({ 
//       message: "Failed to fetch payment status",
//       error: error.error ? error.error.description : error.message 
//     });
//   }
// });

// // Webhook endpoint for UPI payment notifications (recommended)
// app.post("/webhook", express.raw({ type: 'application/json' }), (req, res) => {
//   const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
//   const signature = req.headers['x-razorpay-signature'];
//   const body = req.body; // raw buffer

//   const expectedSignature = crypto
//     .createHmac('sha256', webhookSecret)
//     .update(body)
//     .digest('hex');

//   if (signature === expectedSignature) {
//     const event = JSON.parse(body.toString()); // safe parse
//     console.log("Webhook received:", event.event, event.payload.payment.entity.id);
//     res.json({ status: "success" });
//   } else {
//     return res.status(400).json({ status: "invalid signature" });
//   }
// });


// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.json({ 
//     status: "OK", 
//     timestamp: new Date().toISOString(),
//     service: "razorpay-backend"
//   });
// });

// // Error handling middleware
// app.use((error, req, res, next) => {
//   console.error('Unhandled error:', error);
//   res.status(500).json({ 
//     message: "Internal server error",
//     error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ message: "Endpoint not found" });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT,'0.0.0.0', () => {
//   console.log(`Server running at http://localhost:${PORT}`);
//   console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
// });


// razorpay-backend/server.js - Updated with Routes
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: 'rzp_live_RKCoTHZNLRXSb9',
  key_secret: 'l1Ftg87E3Y10SWW4uO4Mcmo4',
});

// Store owner-account mappings (in production, use a database)
const ownerAccounts = new Map();

// Function to create Razorpay Linked Account for owner (Route)
async function createOwnerAccount(ownerData) {
  try {
    const account = await razorpay.accounts.create({
      email: ownerData.email || `${ownerData.phoneNumber}@mybarber.com`,
      phone: ownerData.phoneNumber,
      type: "route", // Linked account type
      legal_business_name: ownerData.bankAccountHolderName,
      business_type: "individual",
      profile: {
        name: ownerData.bankAccountHolderName,
        contact: ownerData.bankAccountHolderName,
        business_type: "individual",
        category: "beauty_and_wellness", // Example category
        subcategory: "salon",            // Example subcategory
        description: "Salon service provider on MyBarber platform",
        address: {
          street1: "123 Main Street",
          city: "Bengaluru",
          state: "Karnataka",
          postal_code: "560001",
          country: "IN"
        }
      }
    });

    return {
      accountId: account.id,
      status: account.status
    };
  } catch (error) {
    console.error("Error creating linked account:", error);
    throw error;
  }
}

app.post("/register-owner", async (req, res) => {
  const { ownerId, ownerData } = req.body;

  try {
    const razorpayAccount = await createOwnerAccount(ownerData);

    // Store mapping (in production, save to a database)
    ownerAccounts.set(ownerId, razorpayAccount);

    res.json({
      success: true,
      razorpayAccount,
      message: "Owner registered successfully as a Razorpay Linked Account"
    });
  } catch (error) {
    console.error("Owner registration failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register owner with Razorpay",
      error: error.error?.description || error.message
    });
  }
});


// Enhanced payment creation with route support
app.post("/create-order", async (req, res) => {
  const { 
    amount, 
    currency = "INR", 
    receipt = "receipt_001", 
    notes = {},
    ownerId, // Add owner ID for split payments
    commissionPercentage = 20 // Default 20% commission for platform
  } = req.body;

  try {
    let routeConfig = null;

    // If ownerId provided, set up route for split payment
    if (ownerId && ownerAccounts.has(ownerId)) {
      const ownerAccount = ownerAccounts.get(ownerId);
      const platformAmount = Math.round((amount * commissionPercentage / 100) * 100);
      const ownerAmount = Math.round(amount * 100) - platformAmount;

      routeConfig = {
        routes: [
          {
            account: razorpay.key_id, // Platform account
            amount: platformAmount,
            currency: currency
          },
          {
            account: ownerAccount.fundAccountId, // Owner account
            amount: ownerAmount,
            currency: currency
          }
        ]
      };
    }

    const orderOptions = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      payment_capture: 1,
      notes: {
        ...notes,
        created_at: new Date().toISOString(),
        platform: "react-native-expo",
        ownerId: ownerId || 'platform_only'
      }
    };

    // Add routes if configured
    if (routeConfig) {
      orderOptions.routes = routeConfig.routes;
    }

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      orderId: order.id,
      currency: order.currency,
      amount: order.amount / 100,
      key: razorpay.key_id,
      createdAt: order.created_at,
      hasSplit: !!routeConfig
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

// Enhanced payment verification with route support
app.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required payment parameters" 
      });
    }

    const generated_signature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const order = await razorpay.orders.fetch(razorpay_order_id);

        // Check if this was a split payment
        let routeDetails = null;
        if (order.routes && order.routes.length > 0) {
          try {
            const routes = await razorpay.payments.fetchRoutes(razorpay_payment_id);
            routeDetails = routes.items;
          } catch (routeError) {
            console.warn('Could not fetch route details:', routeError);
          }
        }

        if (payment.status === 'captured' || payment.status === 'authorized') {
          return res.json({ 
            success: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paymentStatus: payment.status,
            paymentMethod: payment.method,
            amount: payment.amount / 100,
            routeDetails: routeDetails,
            hasSplit: !!(order.routes && order.routes.length > 0)
          });
        } else {
          return res.status(400).json({ 
            success: false, 
            message: `Payment status: ${payment.status}`,
            paymentStatus: payment.status
          });
        }
      } catch (fetchError) {
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

// Get owner's payout summary
app.get("/owner-payouts/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { start_date, end_date } = req.query;

    if (!ownerAccounts.has(ownerId)) {
      return res.status(404).json({ 
        success: false, 
        message: "Owner not found or not registered with Razorpay" 
      });
    }

    const ownerAccount = ownerAccounts.get(ownerId);
    
    // Fetch settlements for the owner (simplified - in production, use proper settlement APIs)
    const query = {
      count: 100
    };

    if (start_date) query.from = Math.floor(new Date(start_date).getTime() / 1000);
    if (end_date) query.to = Math.floor(new Date(end_date).getTime() / 1000);

    const settlements = await razorpay.settlements.all(query);
    
    // Filter settlements for this owner (this is simplified - actual implementation would be more complex)
    const ownerSettlements = settlements.items.filter(item => 
      item.notes && item.notes.ownerId === ownerId
    );

    res.json({
      success: true,
      ownerId,
      totalSettlements: ownerSettlements.length,
      settlements: ownerSettlements,
      fundAccountId: ownerAccount.fundAccountId
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch payout details",
      error: error.message 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "razorpay-backend-with-routes",
    totalRegisteredOwners: ownerAccounts.size
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
