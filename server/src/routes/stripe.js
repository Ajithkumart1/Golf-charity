// server/src/routes/stripe.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const stripeController = require('../controllers/stripeController');

// Create checkout session (authenticated)
router.post('/create-checkout', authenticate, stripeController.createCheckout);

// Create standalone charity donation checkout (can be anonymous)
router.post('/donate', stripeController.createDonationCheckout);

// Customer portal (manage subscription)
router.post('/portal', authenticate, stripeController.createPortalSession);

// Stripe webhook (raw body — set in index.js)
router.post('/webhook', stripeController.handleWebhook);

module.exports = router;