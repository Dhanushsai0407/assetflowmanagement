const express = require('express');
const router = express.Router();
const {
  registerAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const assetUploads = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

router.route('/')
  .get(protect, getAssets)
  .post(protect, authorize('Asset Manager', 'Admin'), assetUploads, registerAsset);

router.route('/:id')
  .get(protect, getAssetById)
  .put(protect, authorize('Asset Manager', 'Admin'), assetUploads, updateAsset)
  .delete(protect, authorize('Asset Manager', 'Admin'), deleteAsset);

module.exports = router;
