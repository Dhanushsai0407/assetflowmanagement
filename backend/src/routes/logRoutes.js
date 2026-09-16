const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Asset Manager', 'Admin', 'Employee', 'Department Head'), getActivityLogs);

module.exports = router;
