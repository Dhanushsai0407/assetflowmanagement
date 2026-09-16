const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a department name'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide a department code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    departmentHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customHeadName: {
      type: String,
      default: '',
    },
    customHeadEmail: {
      type: String,
      default: '',
    },
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    customParentName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
