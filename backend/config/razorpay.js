const Razorpay = require('razorpay');

// The Key SECRET lives only here on the server. It must never reach React.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;