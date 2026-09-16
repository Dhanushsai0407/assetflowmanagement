const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Info', 'Warning', 'Success', 'Error'],
      default: 'Info',
    },
    status: {
      type: String,
      enum: ['Unread', 'Read', 'Archived'],
      default: 'Unread',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
