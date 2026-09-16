const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, module, details, ipAddress = '') => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      module,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = logActivity;
