// server/src/routes/subscriptions.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const subsController = require('../controllers/subscriptionsController');

router.use(authenticate);
router.get('/my', subsController.getMy);
router.post('/cancel', subsController.cancel);

module.exports = router;