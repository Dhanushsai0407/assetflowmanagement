const express = require('express');
const router = express.Router();
const {
  allocateAsset,
  returnAsset,
  getAllocations,
  createTransferRequest,
  getTransferRequests,
  processTransfer,
} = require('../controllers/allocationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Allocations
router.route('/')
  .get(protect, getAllocations)
  .post(protect, authorize('Asset Manager', 'Admin'), allocateAsset);

router.route('/:id/return')
  .post(protect, authorize('Asset Manager', 'Admin'), returnAsset);

// Transfer Requests
router.route('/transfers')
  .get(protect, getTransferRequests)
  .post(protect, createTransferRequest);

router.route('/transfers/:id')
  .put(protect, authorize('Asset Manager', 'Department Head', 'Admin'), processTransfer);

module.exports = router;
