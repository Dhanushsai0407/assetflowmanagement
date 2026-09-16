const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Department = require('../models/Department');
const Category = require('../models/Category');
const AuditCycle = require('../models/AuditCycle');
const TransferRequest = require('../models/TransferRequest');

// @desc    Get dashboard metrics & cards info
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // 1. Calculate KPI counts
    const assetsAvailable = await Asset.countDocuments({ status: 'Available' });
    const assetsAllocated = await Asset.countDocuments({ status: 'Allocated' });
    const assetsReserved = await Asset.countDocuments({ status: 'Reserved' });
    const assetsMaintenance = await Asset.countDocuments({ status: 'Under Maintenance' });
    const assetsLost = await Asset.countDocuments({ status: 'Lost' });
    
    const activeBookings = await Booking.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } });
    const pendingTransfers = await TransferRequest.countDocuments({ status: 'Pending' });
    const pendingMaintenance = await MaintenanceRequest.countDocuments({ status: 'Pending' });
    
    // Up-to-date overdue allocation checker
    const overdueReturns = await Allocation.countDocuments({
      status: { $in: ['Active', 'Overdue'] },
      expectedReturnDate: { $lt: now }
    });

    const upcomingReturns = await Allocation.countDocuments({
      status: 'Active',
      expectedReturnDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } // Next 7 days
    });

    const activeAudits = await AuditCycle.countDocuments({ status: 'Active' });

    // 2. Asset allocation by category
    const categoriesList = await Category.find({});
    const categoryStats = [];
    for (const cat of categoriesList) {
      const count = await Asset.countDocuments({ category: cat._id });
      categoryStats.push({ name: cat.name, count });
    }

    // 3. Asset status distribution
    const statusStats = [
      { name: 'Available', value: assetsAvailable },
      { name: 'Allocated', value: assetsAllocated },
      { name: 'Reserved', value: assetsReserved },
      { name: 'Under Maintenance', value: assetsMaintenance },
      { name: 'Lost', value: assetsLost },
    ];

    // 4. Department-wise Allocation count
    const departments = await Department.find({});
    const departmentStats = [];
    for (const dept of departments) {
      const count = await Asset.countDocuments({ department: dept._id });
      departmentStats.push({ name: dept.code, value: count });
    }

    // 5. Recent notifications & activity
    // In a real app we would load active user's notifications. We'll return placeholder summaries.
    const recentMaintenance = await MaintenanceRequest.find({})
      .populate('asset', 'name assetTag')
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAllocations = await Allocation.find({})
      .populate('asset', 'name assetTag')
      .populate('allocatedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        kpis: {
          assetsAvailable,
          assetsAllocated,
          assetsReserved,
          assetsMaintenance,
          assetsLost,
          activeBookings,
          pendingTransfers,
          pendingMaintenance,
          overdueReturns,
          upcomingReturns,
          activeAudits
        },
        charts: {
          byCategory: categoryStats,
          byStatus: statusStats,
          byDepartment: departmentStats,
        },
        recent: {
          maintenance: recentMaintenance,
          allocations: recentAllocations
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed reports and trends
// @route   GET /api/reports/analytics
// @access  Private/AssetManager/Admin
const getAnalytics = async (req, res) => {
  try {
    // 1. Asset utilization trends (Allocated vs Available ratio)
    const totalAssets = await Asset.countDocuments({});
    const allocated = await Asset.countDocuments({ status: 'Allocated' });
    const utilizationRate = totalAssets > 0 ? Math.round((allocated / totalAssets) * 100) : 0;

    // 2. Booking peak hour heatmaps (Simulated hours distribution from 8am to 6pm)
    const bookings = await Booking.find({ status: { $ne: 'Cancelled' } });
    const hourlyDistribution = Array.from({ length: 11 }, (_, i) => ({ hour: `${8 + i}:00`, count: 0 }));
    
    bookings.forEach((b) => {
      const startHour = b.startTime.getHours();
      if (startHour >= 8 && startHour <= 18) {
        hourlyDistribution[startHour - 8].count += 1;
      }
    });

    // 3. Maintenance frequency by Category
    const maintenanceRequests = await MaintenanceRequest.find({}).populate('asset');
    const categoryFreq = {};
    for (const req of maintenanceRequests) {
      if (req.asset && req.asset.category) {
        const cat = await Category.findById(req.asset.category);
        if (cat) {
          categoryFreq[cat.name] = (categoryFreq[cat.name] || 0) + 1;
        }
      }
    }
    const maintenanceByCategory = Object.keys(categoryFreq).map((key) => ({
      name: key,
      count: categoryFreq[key],
    }));

    // 4. Retiring assets: acquisition cost list & condition status
    const criticalAssets = await Asset.find({ condition: 'Poor', status: { $nin: ['Retired', 'Disposed'] } })
      .populate('category', 'name')
      .populate('department', 'name code');

    res.json({
      success: true,
      data: {
        utilization: {
          totalAssets,
          allocated,
          utilizationRate,
        },
        bookingHeatmap: hourlyDistribution,
        maintenanceByCategory,
        retiringAssets: criticalAssets,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
};
