// server/src/routes/users.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, requireActiveSubscription } = require('../middleware/auth');
const validate = require('../middleware/validate');
const usersController = require('../controllers/usersController');

router.use(authenticate);

// GET /api/users/me
router.get('/me', usersController.getMe);

// PATCH /api/users/me
router.patch('/me',
  [
    body('full_name').optional().notEmpty().trim(),
    body('charity_percentage').optional().isFloat({ min: 10, max: 100 }),
    body('charity_id').optional().isUUID(),
  ],
  validate,
  usersController.updateMe
);

// GET /api/users/me/subscription
router.get('/me/subscription', usersController.getMySubscription);

// GET /api/users/me/dashboard — combined data for dashboard
router.get('/me/dashboard', requireActiveSubscription, usersController.getDashboard);

module.exports = router;