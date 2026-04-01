// server/src/routes/charities.js
const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const charitiesController = require('../controllers/charitiesController');

// Public
router.get('/', charitiesController.list);
router.get('/:id', charitiesController.getOne);

// Admin
router.post(
  '/',
  authenticate, requireAdmin,
  [body('name').notEmpty().trim(), body('category').notEmpty()],
  validate,
  charitiesController.create
);
router.put('/:id', authenticate, requireAdmin, charitiesController.update);
router.delete('/:id', authenticate, requireAdmin, charitiesController.remove);

module.exports = router;