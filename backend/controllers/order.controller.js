const crypto = require('crypto');
const Customer = require('../models/customer.model');
const Order = require('../models/order.model');
const razorpay = require('../config/razorpay');

const isValidId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const ADDRESS_FIELDS = [
  ['fullName', 'Full name'],
  ['phone', 'Phone'],
  ['addressLine1', 'Address'],
  ['city', 'City'],
  ['state', 'State'],
  ['pincode', 'Pincode'],
];

// Returns { error } or { address } (trimmed copy). Whitespace-only counts as empty.
function validateShippingAddress(input) {
  if (!input || typeof input !== 'object') return { error: 'Shipping address is required' };
  const address = {};
  for (const [key, label] of ADDRESS_FIELDS) {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if (!value) return { error: `${label} is required` };
    address[key] = value;
  }
  if (!/^\d{10}$/.test(address.phone)) return { error: 'Phone must contain 10 digits' };
  if (!/^\d{6}$/.test(address.pincode)) return { error: 'Pincode must contain 6 digits' };
  return { address };
}

// POST /orders/create-payment-order
// Body: { shippingAddress }  -- anything else (totals, items, prices) is ignored.
async function createPaymentOrder(req, res) {
  try {
    const { error, address } = validateShippingAddress(req.body.shippingAddress);
    if (error) return res.status(400).json({ success: false, message: error });

    // Load the cart WITH the latest product data (price + stock right now)
    const customer = await Customer.findById(req.user._id).populate('cart.product');
    if (!customer.cart.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const items = [];
    let total = 0;
    for (const entry of customer.cart) {
      const product = entry.product;
      if (!product) {
        return res.status(400).json({ success: false, message: 'A product in your cart is no longer available' });
      }
      if (entry.quantity > product.stock) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });
      }
      // Snapshot
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: entry.quantity,
        image: product.image,
      });
      total += product.price * entry.quantity; // server owns the total
    }
    total = Math.round(total * 100) / 100;

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress: address,
      totalAmount: total,
    }); // status PENDING_PAYMENT, paymentStatus PENDING by default

    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: Math.round(total * 100), // rupees -> paise
        currency: 'INR',
        receipt: order._id.toString(),
      });
    } catch (err) {
      console.error('Razorpay order creation failed:', err);
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(502).json({ success: false, message: 'Could not start payment. Please try again.' });
    }

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    // Cart is deliberately NOT touched here.
    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // paise
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // Key ID is public. The secret never leaves the server.
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

function signaturesMatch(expected, received) {
  const a = Buffer.from(expected);
  const b = Buffer.from(String(received));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// POST /orders/verify-payment
async function verifyPayment(req, res) {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!isValidId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Ownership is part of the query: another user's order simply "doesn't exist"
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Safe to call twice (e.g. a retry after a network blip)
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, message: 'Payment already verified', order });
    }

    // Trust the order id WE stored, not only the browser's
    if (razorpay_order_id !== order.razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Order mismatch' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(order.razorpayOrderId + '|' + razorpay_payment_id)
      .digest('hex');

    if (!signaturesMatch(expected, razorpay_signature)) {
      // Order stays PENDING and the cart is untouched
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Only now, after verified payment, is the cart cleared
    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({ success: true, message: 'Payment verified', order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /orders  -- only this user's PAID orders, newest first
async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user._id, paymentStatus: 'PAID' }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /orders/:id
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: 'Invalid order ID' });

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

module.exports = { createPaymentOrder, verifyPayment, getMyOrders, getOrderById };