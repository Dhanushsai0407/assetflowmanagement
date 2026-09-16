const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset');
const User = require('../models/User');
const TransferRequest = require('../models/TransferRequest');
const logActivity = require('../utils/logger');
const createNotification = require('../utils/notifier');

// @desc    Allocate asset to employee or department
// @route   POST /api/allocations
// @access  Private/AssetManager
const allocateAsset = async (req, res) => {
  try {
    const { assetId, employeeId, departmentId, expectedReturnDate, notes } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Check Conflict Rule
    if (asset.status !== 'Available') {
      // Find who holds it currently
      const activeAllocation = await Allocation.findOne({ asset: assetId, status: 'Active' })
        .populate('allocatedTo', 'name email');
      
      let holderMsg = 'already in use';
      let heldBy = null;
      
      if (activeAllocation && activeAllocation.allocatedTo) {
        holderMsg = `currently held by ${activeAllocation.allocatedTo.name}`;
        heldBy = {
          id: activeAllocation.allocatedTo._id,
          name: activeAllocation.allocatedTo.name,
          email: activeAllocation.allocatedTo.email
        };
      } else if (asset.status === 'Under Maintenance') {
        holderMsg = 'currently under maintenance';
      }

      return res.status(400).json({
        success: false,
        message: `This asset is currently allocated (${holderMsg}).`,
        conflict: true,
        heldBy,
        assetStatus: asset.status
      });
    }

    // Allocate
    const allocation = await Allocation.create({
      asset: assetId,
      allocatedTo: employeeId && employeeId !== 'other' ? employeeId : null,
      customEmployeeName: employeeId === 'other' ? req.body.customEmployeeName : '',
      customEmployeeEmail: employeeId === 'other' ? req.body.customEmployeeEmail : '',
      allocatedDepartment: departmentId || null,
      allocatedBy: req.user._id,
      expectedReturnDate: expectedReturnDate || null,
      notes: notes || '',
      status: 'Active',
    });

    // Update asset status
    asset.status = 'Allocated';
    if (departmentId) asset.department = departmentId;
    await asset.save();

    await logActivity(req.user._id, 'ALLOCATE_ASSET', 'Allocations', `Allocated asset ${asset.assetTag} to User ID: ${employeeId || 'none'} (${req.body.customEmployeeName || ''})`, req.ip);

    if (employeeId && employeeId !== 'other') {
      await createNotification(employeeId, 'Asset Allocated', `Asset ${asset.name} (${asset.assetTag}) has been allocated to you. Expected return: ${expectedReturnDate || 'N/A'}.`, 'Success');
    }

    res.status(201).json({ success: true, data: allocation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Return allocated asset
// @route   POST /api/allocations/:id/return
// @access  Private/AssetManager
const returnAsset = async (req, res) => {
  try {
    const { returnConditionCheck, returnNotes } = req.body;
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation || allocation.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Active allocation not found' });
    }

    const asset = await Asset.findById(allocation.asset);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Update Allocation
    allocation.actualReturnDate = Date.now();
    allocation.status = 'Returned';
    allocation.returnConditionCheck = returnConditionCheck || 'Excellent';
    allocation.returnNotes = returnNotes || '';
    await allocation.save();

    // Update Asset
    asset.status = 'Available';
    asset.condition = returnConditionCheck || asset.condition;
    await asset.save();

    await logActivity(req.user._id, 'RETURN_ASSET', 'Allocations', `Returned asset ${asset.assetTag}. Return condition: ${returnConditionCheck}`, req.ip);

    if (allocation.allocatedTo) {
      await createNotification(allocation.allocatedTo, 'Asset Returned Successfully', `Asset ${asset.name} (${asset.assetTag}) return has been processed.`, 'Success');
    }

    res.json({ success: true, data: allocation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active/overdue allocations
// @route   GET /api/allocations
// @access  Private
const getAllocations = async (req, res) => {
  try {
    // Automatically flag overdue allocations on query
    const now = new Date();
    await Allocation.updateMany(
      { status: 'Active', expectedReturnDate: { $lt: now } },
      { status: 'Overdue' }
    );

    const allocations = await Allocation.find({})
      .populate('asset', 'name assetTag serialNumber category status')
      .populate('allocatedTo', 'name email department')
      .populate('allocatedDepartment', 'name code')
      .populate('allocatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: allocations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// Transfer Workflows
// ==========================================

// @desc    Request direct asset transfer from employee
// @route   POST /api/transfers
// @access  Private
const createTransferRequest = async (req, res) => {
  try {
    const { assetId, toUserId, reason } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Check who currently holds the asset
    const activeAllocation = await Allocation.findOne({ asset: assetId, status: { $in: ['Active', 'Overdue'] } });
    if (!activeAllocation) {
      return res.status(400).json({ success: false, message: 'Asset is not currently allocated to anyone' });
    }

    const fromUserId = activeAllocation.allocatedTo;
    if (!fromUserId) {
      return res.status(400).json({ success: false, message: 'Asset is allocated to a department, not a user. Transfer not available.' });
    }

    // Request
    const transfer = await TransferRequest.create({
      asset: assetId,
      fromUser: fromUserId,
      toUser: toUserId && toUserId !== 'other' ? toUserId : null,
      customToEmployeeName: toUserId === 'other' ? req.body.customToEmployeeName : '',
      customToEmployeeEmail: toUserId === 'other' ? req.body.customToEmployeeEmail : '',
      requestedBy: req.user._id,
      reason,
      status: 'Pending',
    });

    await logActivity(req.user._id, 'TRANSFER_REQUEST', 'Transfers', `Transfer requested for asset ${asset.assetTag} to ${toUserId === 'other' ? req.body.customToEmployeeName : toUserId}`, req.ip);

    // Notify the target user
    if (toUserId && toUserId !== 'other') {
      await createNotification(toUserId, 'Transfer Request Pending', `A transfer request is initiated for you to receive asset ${asset.name}.`, 'Info');
    }

    // Notify Department Heads & Asset Managers
    const managers = await User.find({ role: { $in: ['Asset Manager', 'Admin'] } });
    for (const mgr of managers) {
      await createNotification(mgr._id, 'New Transfer Request', `Transfer requested for ${asset.assetTag} from holder to another employee.`, 'Info');
    }

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all transfer requests
// @route   GET /api/transfers
// @access  Private
const getTransferRequests = async (req, res) => {
  try {
    let query = {};
    
    // Non-managers see transfers involving them
    if (['Employee', 'Department Head'].includes(req.user.role)) {
      query = {
        $or: [
          { fromUser: req.user._id },
          { toUser: req.user._id },
          { requestedBy: req.user._id },
        ],
      };
    }

    const transfers = await TransferRequest.find(query)
      .populate('asset', 'name assetTag serialNumber category')
      .populate('fromUser', 'name email department')
      .populate('toUser', 'name email department')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject transfer requests
// @route   PUT /api/transfers/:id
// @access  Private/AssetManager/DepartmentHead
const processTransfer = async (req, res) => {
  try {
    const { action, approvalNotes } = req.body; // Action: Approved / Rejected
    const transfer = await TransferRequest.findById(req.params.id);

    if (!transfer || transfer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Pending transfer request not found' });
    }

    const asset = await Asset.findById(transfer.asset);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (action === 'Approved') {
      // 1. Close current active allocation
      const currentAllocation = await Allocation.findOne({ asset: transfer.asset, status: { $in: ['Active', 'Overdue'] } });
      if (currentAllocation) {
        currentAllocation.status = 'Returned';
        currentAllocation.actualReturnDate = Date.now();
        currentAllocation.returnNotes = 'Asset transferred via Request approval';
        await currentAllocation.save();
      }

      // 2. Create new allocation for target employee
      let targetUser = null;
      if (transfer.toUser) {
        targetUser = await User.findById(transfer.toUser);
      }
      const newAllocation = await Allocation.create({
        asset: transfer.asset,
        allocatedTo: transfer.toUser,
        customEmployeeName: transfer.customToEmployeeName || '',
        customEmployeeEmail: transfer.customToEmployeeEmail || '',
        allocatedDepartment: targetUser ? targetUser.department : null,
        allocatedBy: req.user._id,
        notes: `Transferred from User ID: ${transfer.fromUser}. Notes: ${approvalNotes || ''}`,
        status: 'Active',
      });

      // 3. Update asset details
      if (targetUser && targetUser.department) {
        asset.department = targetUser.department;
      }
      asset.status = 'Allocated';
      await asset.save();

      // 4. Update transfer request
      transfer.status = 'Approved';
      transfer.approvedBy = req.user._id;
      transfer.approvalNotes = approvalNotes || '';
      await transfer.save();

      await logActivity(req.user._id, 'TRANSFER_APPROVE', 'Transfers', `Approved transfer of asset ${asset.assetTag} to ${targetUser ? targetUser.name : transfer.customToEmployeeName || 'unknown'}`, req.ip);

      // Notifications
      await createNotification(transfer.fromUser, 'Transfer Completed', `Asset ${asset.name} (${asset.assetTag}) you held has been transferred to another user.`, 'Warning');
      
      if (transfer.toUser) {
        await createNotification(transfer.toUser, 'Asset Transferred to You', `Asset ${asset.name} (${asset.assetTag}) has been transferred to you.`, 'Success');
      }

    } else {
      transfer.status = 'Rejected';
      transfer.approvedBy = req.user._id;
      transfer.approvalNotes = approvalNotes || '';
      await transfer.save();

      await logActivity(req.user._id, 'TRANSFER_REJECT', 'Transfers', `Rejected transfer of asset ${asset.assetTag}`, req.ip);

      await createNotification(transfer.requestedBy, 'Transfer Request Rejected', `Your transfer request for ${asset.assetTag} was rejected.`, 'Error');
    }

    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  allocateAsset,
  returnAsset,
  getAllocations,
  createTransferRequest,
  getTransferRequests,
  processTransfer,
};
