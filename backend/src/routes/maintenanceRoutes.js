const express = require('express');
const router = express.Router();
const {
  createMaintenanceRequest,
  getMaintenanceRequests,
  processMaintenance,
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const maintenanceUploads = upload.fields([{ name: 'photos', maxCount: 5 }]);

router.route('/')
  .get(protect, getMaintenanceRequests)
  .post(protect, maintenanceUploads, createMaintenanceRequest);

router.route('/:id')
  .put(protect, authorize('Asset Manager', 'Admin'), processMaintenance);

module.exports = router;
