// server/src/routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

// Users
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Admin: edit any user's scores
router.get('/users/:id/scores', adminController.getUserScores);
router.post('/users/:id/scores', adminController.addUserScore);
router.delete('/scores/:scoreId', adminController.deleteScore);

// Subscriptions
router.get('/subscriptions', adminController.listSubscriptions);
router.patch('/subscriptions/:id', adminController.updateSubscription);

// Reports
router.get('/reports/overview', adminController.overviewReport);
router.get('/reports/prize-pools', adminController.prizePoolReport);
router.get('/reports/charity-totals', adminController.charityTotalsReport);
router.get('/reports/draw-stats', adminController.drawStatsReport);

module.exports = router;