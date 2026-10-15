const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// POST /wishlist/:productId
async function addToWishlist(req, res) {
  try {
    const { productId } = req.params;
    if (!isValidId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    if (!(await Product.exists({ _id: productId }))) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Atomic: the filter itself rejects duplicates, so two simultaneous
    // requests cannot both insert (a read-then-push check could).
    const result = await Customer.updateOne(
      { _id: req.user._id, wishlist: { $ne: productId } },
      { $push: { wishlist: productId } }
    );
    if (result.modifiedCount === 0) {
      return res.status(409).json({ success: false, message: 'Product already in wishlist' });
    }
    return res.status(201).json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /wishlist
async function getWishlist(req, res) {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price category image stock',
    });
    // populate() gives null for products deleted from the catalogue
    const wishlist = customer.wishlist.filter(Boolean);
    return res.status(200).json({ success: true, count: wishlist.length, wishlist });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// DELETE /wishlist/:productId
async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    if (!isValidId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const result = await Customer.updateOne(
      { _id: req.user._id },
      { $pull: { wishlist: productId } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not in wishlist' });
    }
    return res.status(200).json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

module.exports = { addToWishlist, getWishlist, removeFromWishlist };