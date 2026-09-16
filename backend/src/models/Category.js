const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Text', 'Number', 'Date', 'Boolean'],
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    customFields: [customFieldSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
