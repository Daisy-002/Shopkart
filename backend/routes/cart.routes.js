const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateQuantity, removeFromCart } = require('../controllers/cart.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware); // every cart route is protected

router.get('/', getCart);
router.post('/:productId', addToCart);
router.patch('/:productId', updateQuantity);
router.delete('/:productId', removeFromCart);

module.exports = router;