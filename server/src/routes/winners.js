// server/src/routes/winners.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, requireActiveSubscription, requireAdmin } = require('../middleware/auth');
const winnersController = require('../controllers/winnersController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Subscriber: my winnings
router.get('/my', authenticate, requireActiveSubscription, winnersController.getMyWinnings);

// Subscriber: upload proof
router.post(
  '/:id/proof',
  authenticate,
  requireActiveSubscription,
  upload.single('proof'),
  winnersController.uploadProof
);

// Admin: list all winners
router.get('/', authenticate, requireAdmin, winnersController.listAll);

// Admin: verify proof
router.patch('/:id/verify', authenticate, requireAdmin, winnersController.verifyProof);

// Admin: mark paid
router.patch('/:id/paid', authenticate, requireAdmin, winnersController.markPaid);

module.exports = router;