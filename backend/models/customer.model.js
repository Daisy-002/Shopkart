const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    // LAB 04: references only. Product stays the source of truth.
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // LAB 05: reference + quantity. No price/subtotal stored (they are derived).
    cart: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);