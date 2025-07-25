const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  const { amount, currency = "INR", receipt = "receipt_001" } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay accepts amount in paise
      currency,
      receipt,
    });

    res.json({
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID // ✅ safe to expose
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ message: "Order creation failed", error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
