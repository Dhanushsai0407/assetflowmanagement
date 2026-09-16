const mongoose = require('mongoose');

const auditCycleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Audit Cycle title is required'],
      trim: true,
    },
    scopeDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    scopeLocation: {
      type: String,
      trim: true,
      default: '',
    },
    auditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Completed'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditCycle', auditCycleSchema);
