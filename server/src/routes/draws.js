// server/src/routes/draws.js
const express = require('express');
const router = express.Router();
const { authenticate, requireActiveSubscription, requireAdmin } = require('../middleware/auth');
const drawsController = require('../controllers/drawsController');

// Public: list published draws
router.get('/', drawsController.listDraws);
router.get('/:id', drawsController.getDraw);

// Subscriber: my draw results
router.get('/my/results', authenticate, requireActiveSubscription, drawsController.getMyResults);

// Admin only
router.post('/', authenticate, requireAdmin, drawsController.createDraw);
router.post('/:id/simulate', authenticate, requireAdmin, drawsController.simulateDraw);
router.post('/:id/publish', authenticate, requireAdmin, drawsController.publishDraw);

module.exports = router;