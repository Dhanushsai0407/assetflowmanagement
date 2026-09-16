const MaintenanceRequest = require('../models/MaintenanceRequest');
const Asset = require('../models/Asset');
const User = require('../models/User');
const logActivity = require('../utils/logger');
const createNotification = require('../utils/notifier');

// @desc    Raise a maintenance request
// @route   POST /api/maintenance
// @access  Private
const createMaintenanceRequest = async (req, res) => {
  try {
    const { assetId, issueDescription, priority } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Capture files
    const photoUrls = [];
    if (req.files && req.files.photos) {
      req.files.photos.forEach((file) => {
        photoUrls.push(file.path);
      });
    }

    const request = await MaintenanceRequest.create({
      asset: assetId,
      reportedBy: req.user._id,
      issueDescription,
      priority: priority || 'Medium',
      photos: photoUrls,
      status: 'Pending',
    });

    await logActivity(req.user._id, 'RAISE_MAINTENANCE', 'Maintenance', `Raised maintenance request for ${asset.assetTag}`, req.ip);

    // Notify Asset Managers
    const managers = await User.find({ role: { $in: ['Asset Manager', 'Admin'] } });
    for (const mgr of managers) {
      await createNotification(mgr._id, 'New Maintenance Request', `Maintenance reported on ${asset.assetTag} by ${req.user.name}.`, 'Warning');
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all maintenance requests
// @route   GET /api/maintenance
// @access  Private
const getMaintenanceRequests = async (req, res) => {
  try {
    let query = {};
    
    // Regular employees only see requests they reported
    if (req.user.role === 'Employee') {
      query = { reportedBy: req.user._id };
    }

    const requests = await MaintenanceRequest.find(query)
      .populate('asset', 'name assetTag serialNumber category status location condition')
      .populate('reportedBy', 'name email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process maintenance request (Approve/Reject/Update workflow)
// @route   PUT /api/maintenance/:id
// @access  Private/AssetManager
const processMaintenance = async (req, res) => {
  try {
    const { status, assignedTechnician, assetManagerNotes, resolutionNotes } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Maintenance request not found' });
    }

    const asset = await Asset.findById(request.asset);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const oldStatus = request.status;
    request.status = status || request.status;
    if (assignedTechnician !== undefined) request.assignedTechnician = assignedTechnician;
    if (assetManagerNotes !== undefined) request.assetManagerNotes = assetManagerNotes;
    if (resolutionNotes !== undefined) request.resolutionNotes = resolutionNotes;

    // Asset status sync rules:
    // If request is APPROVED, change asset status to Under Maintenance
    if (status === 'Approved' && oldStatus === 'Pending') {
      asset.status = 'Under Maintenance';
      await asset.save();
      await createNotification(request.reportedBy, 'Maintenance Approved', `Your maintenance request for ${asset.name} was approved.`, 'Success');
    }

    // If request is REJECTED
    if (status === 'Rejected' && oldStatus === 'Pending') {
      await createNotification(request.reportedBy, 'Maintenance Rejected', `Your maintenance request for ${asset.name} was rejected.`, 'Error');
    }

    // If request is RESOLVED or CLOSED, restore asset status to Available
    if ((status === 'Resolved' || status === 'Closed') && asset.status === 'Under Maintenance') {
      asset.status = 'Available';
      await asset.save();
      await createNotification(request.reportedBy, 'Maintenance Resolved', `The issue with ${asset.name} has been resolved.`, 'Success');
    }

    const updatedRequest = await request.save();

    await logActivity(
      req.user._id,
      'PROCESS_MAINTENANCE',
      'Maintenance',
      `Updated request ID: ${request._id} to status: ${request.status}`,
      req.ip
    );

    res.json({ success: true, data: updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMaintenanceRequest,
  getMaintenanceRequests,
  processMaintenance,
};
