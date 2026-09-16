const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    assetTag: {
      type: String,
      unique: true,
      required: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    customCategoryName: {
      type: String,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    customDepartmentName: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: 'HQ',
    },
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },
    acquisitionCost: {
      type: Number,
      default: 0,
    },
    warrantyExpiration: {
      type: Date,
      default: null,
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      default: 'Excellent',
    },
    status: {
      type: String,
      enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
      default: 'Available',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    documentUrls: [
      {
        type: String,
      },
    ],
    bookable: {
      type: Boolean,
      default: false,
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    customData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Asset', assetSchema);
