const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  readAll,
  archiveNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getNotifications);

router.route('/read-all')
  .put(protect, readAll);

router.route('/:id/read')
  .put(protect, markAsRead);

router.route('/:id/archive')
  .put(protect, archiveNotification);

module.exports = router;
