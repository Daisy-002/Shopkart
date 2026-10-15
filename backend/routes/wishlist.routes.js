const express = require('express');
const router = express.Router();
const { addToWishlist, getWishlist, removeFromWishlist } = require('../controllers/wishlist.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware); // every wishlist route is protected

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;