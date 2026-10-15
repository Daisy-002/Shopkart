const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Always return the cart in the same populated shape
async function loadCart(customerId) {
  const customer = await Customer.findById(customerId).populate({
    path: 'cart.product',
    select: 'name price category image stock',
  });
  return customer.cart.filter((item) => item.product); // drop deleted products
}

// POST /cart/:productId
async function addToCart(req, res) {
  try {
    const { productId } = req.params;
    if (!isValidId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Case 1: already in cart AND quantity < stock -> atomic +1.
    // The stock check lives inside the filter, so it cannot race.
    const incremented = await Customer.updateOne(
      { _id: req.user._id, cart: { $elemMatch: { product: productId, quantity: { $lt: product.stock } } } },
      { $inc: { 'cart.$.quantity': 1 } }
    );

    if (incremented.modifiedCount === 0) {
      // Case 2: in cart but at the stock limit
      const alreadyInCart = await Customer.exists({ _id: req.user._id, 'cart.product': productId });
      if (alreadyInCart) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
      }
      // Case 3: not in cart yet
      if (product.stock < 1) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }
      await Customer.updateOne(
        { _id: req.user._id, 'cart.product': { $ne: productId } },
        { $push: { cart: { product: productId, quantity: 1 } } }
      );
    }

    return res.status(200).json({ success: true, message: 'Cart updated', cart: await loadCart(req.user._id) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /cart
async function getCart(req, res) {
  try {
    return res.status(200).json({ success: true, cart: await loadCart(req.user._id) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// PATCH /cart/:productId   body: { quantity }
async function updateQuantity(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!isValidId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number' });
    }
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }

    const result = await Customer.updateOne(
      { _id: req.user._id, 'cart.product': productId },
      { $set: { 'cart.$.quantity': quantity } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    return res.status(200).json({ success: true, message: 'Quantity updated', cart: await loadCart(req.user._id) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// DELETE /cart/:productId
async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    if (!isValidId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const result = await Customer.updateOne(
      { _id: req.user._id },
      { $pull: { cart: { product: productId } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }
    return res.status(200).json({ success: true, message: 'Item removed', cart: await loadCart(req.user._id) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

module.exports = { addToCart, getCart, updateQuantity, removeFromCart };