const Booking = require('../models/Booking');
const Asset = require('../models/Asset');
const logActivity = require('../utils/logger');
const createNotification = require('../utils/notifier');

// @desc    Create a resource booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { resourceId, title, startTime, endTime, customResourceName } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'Start time must be before end time' });
    }

    let resourceName = '';
    const overlappingQuery = {
      status: { $in: ['Upcoming', 'Ongoing'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    };

    if (resourceId && resourceId !== 'other') {
      const resource = await Asset.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }
      if (!resource.bookable) {
        return res.status(400).json({ success: false, message: 'This asset is not flagged as a shared/bookable resource' });
      }
      overlappingQuery.resource = resourceId;
      resourceName = resource.name;
    } else {
      if (!customResourceName || !customResourceName.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide a custom resource name' });
      }
      overlappingQuery.customResourceName = customResourceName;
      resourceName = customResourceName;
    }

    // Overlap validation
    const overlappingBooking = await Booking.findOne(overlappingQuery).populate('bookedBy', 'name email');

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: `Time slot conflict. This resource is already booked by ${overlappingBooking.bookedBy.name} from ${overlappingBooking.startTime.toLocaleTimeString()} to ${overlappingBooking.endTime.toLocaleTimeString()}.`,
        conflict: true,
      });
    }

    const booking = await Booking.create({
      resource: resourceId !== 'other' ? resourceId : null,
      customResourceName: resourceId === 'other' ? customResourceName : '',
      bookedBy: req.user._id,
      bookedDepartment: req.user.department || null,
      title,
      startTime: start,
      endTime: end,
      status: 'Upcoming',
    });

    await logActivity(req.user._id, 'CREATE_BOOKING', 'Bookings', `Booked resource ${resourceName}: ${title}`, req.ip);
    await createNotification(req.user._id, 'Booking Confirmed', `Your booking for ${resourceName} is confirmed for ${start.toLocaleString()}.`, 'Success');

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings (can filter by resource, status, user)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const { resource, status } = req.query;
    const query = {};

    if (resource) query.resource = resource;
    if (status) query.status = status;

    // Regular employees only see their own bookings if they are browsing user-level bookings,
    // but can see all resource schedules on calendar. Let's return all for visual calendars.
    const bookings = await Booking.find(query)
      .populate('resource', 'name assetTag category location status')
      .populate('bookedBy', 'name email department')
      .populate('bookedDepartment', 'name code')
      .sort({ startTime: 1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization: only creator, Asset Manager, or Admin can cancel
    if (
      String(booking.bookedBy) !== String(req.user._id) &&
      !['Asset Manager', 'Admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    await logActivity(req.user._id, 'CANCEL_BOOKING', 'Bookings', `Cancelled booking ID: ${booking._id}`, req.ip);
    await createNotification(booking.bookedBy, 'Booking Cancelled', `Your booking for resource was cancelled.`, 'Warning');

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule a booking
// @route   PUT /api/bookings/:id/reschedule
// @access  Private
const rescheduleBooking = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization Check
    if (
      String(booking.bookedBy) !== String(req.user._id) &&
      !['Asset Manager', 'Admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this booking' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'Start time must be before end time' });
    }

    // Overlap validation excluding this booking itself
    const overlappingQuery = {
      _id: { $ne: booking._id },
      status: { $in: ['Upcoming', 'Ongoing'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    };
    if (booking.resource) {
      overlappingQuery.resource = booking.resource;
    } else {
      overlappingQuery.customResourceName = booking.customResourceName;
    }

    const overlappingBooking = await Booking.findOne(overlappingQuery).populate('bookedBy', 'name email');

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: `Time slot conflict. Resource is booked by ${overlappingBooking.bookedBy.name} from ${overlappingBooking.startTime.toLocaleTimeString()} to ${overlappingBooking.endTime.toLocaleTimeString()}.`,
        conflict: true,
      });
    }

    booking.startTime = start;
    booking.endTime = end;
    booking.status = 'Upcoming'; // Reset to upcoming if rescheduled
    await booking.save();

    await logActivity(req.user._id, 'RESCHEDULE_BOOKING', 'Bookings', `Rescheduled booking ID: ${booking._id}`, req.ip);
    await createNotification(booking.bookedBy, 'Booking Rescheduled', `Your booking has been rescheduled to ${start.toLocaleString()}.`, 'Success');

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  cancelBooking,
  rescheduleBooking,
};
