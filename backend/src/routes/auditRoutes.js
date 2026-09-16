const express = require('express');
const router = express.Router();
const {
  createAuditCycle,
  startAuditCycle,
  getAuditCycles,
  getAuditItems,
  verifyAuditItem,
  closeAuditCycle,
} = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAuditCycles)
  .post(protect, authorize('Admin'), createAuditCycle);

router.route('/:id/start')
  .put(protect, authorize('Admin'), startAuditCycle);

router.route('/:id/close')
  .put(protect, authorize('Admin'), closeAuditCycle);

router.route('/:id/items')
  .get(protect, getAuditItems);

router.route('/items/:itemId')
  .put(protect, verifyAuditItem);

module.exports = router;
