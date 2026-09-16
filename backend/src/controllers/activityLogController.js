const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs (Admin / AssetManager only)
// @route   GET /api/logs
// @access  Private/AssetManager/Admin
const getActivityLogs = async (req, res) => {
  try {
    const { search, moduleFilter, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (moduleFilter) {
      query.module = moduleFilter;
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActivityLogs,
};
