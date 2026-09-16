const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  cancelBooking,
  rescheduleBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router.route('/:id/cancel')
  .put(protect, cancelBooking);

router.route('/:id/reschedule')
  .put(protect, rescheduleBooking);

module.exports = router;
