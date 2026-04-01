// server/src/routes/scores.js
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authenticate, requireActiveSubscription } = require('../middleware/auth');
const validate = require('../middleware/validate');
const scoresController = require('../controllers/scoresController');

router.use(authenticate, requireActiveSubscription);

// GET /api/scores — get current user's scores
router.get('/', scoresController.getMyScores);

// POST /api/scores — add a score
router.post(
  '/',
  [
    body('score').isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
    body('played_at').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
  ],
  validate,
  scoresController.addScore
);

// DELETE /api/scores/:id
router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  scoresController.deleteScore
);

module.exports = router;