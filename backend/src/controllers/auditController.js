const AuditCycle = require('../models/AuditCycle');
const AuditItem = require('../models/AuditItem');
const Asset = require('../models/Asset');
const logActivity = require('../utils/logger');
const createNotification = require('../utils/notifier');

// @desc    Create Audit Cycle and generate audit items based on scope
// @route   POST /api/audits
// @access  Private/Admin
const createAuditCycle = async (req, res) => {
  try {
    const { title, scopeDepartment, scopeLocation, auditors, startDate, endDate } = req.body;

    const auditCycle = await AuditCycle.create({
      title,
      scopeDepartment: scopeDepartment || null,
      scopeLocation: scopeLocation || '',
      auditors: auditors || [],
      startDate,
      endDate,
      status: 'Draft',
    });

    // Log cycle creation
    await logActivity(req.user._id, 'CREATE_AUDIT_CYCLE', 'Audits', `Created audit cycle: ${title}`, req.ip);

    res.status(201).json({ success: true, data: auditCycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start/Activate Audit Cycle (Generates AuditItems for scoping assets)
// @route   PUT /api/audits/:id/start
// @access  Private/Admin
const startAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found' });
    }

    if (cycle.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Audit cycle is already active or completed' });
    }

    // Identify assets in scope
    const query = {};
    if (cycle.scopeDepartment) {
      query.department = cycle.scopeDepartment;
    }
    if (cycle.scopeLocation) {
      query.location = { $regex: cycle.scopeLocation, $options: 'i' };
    }
    // Exclude retired or disposed items
    query.status = { $nin: ['Retired', 'Disposed'] };

    const assetsInScope = await Asset.find(query);

    // Create AuditItems
    const items = assetsInScope.map((asset) => ({
      auditCycle: cycle._id,
      asset: asset._id,
      status: 'Pending',
    }));

    if (items.length > 0) {
      await AuditItem.insertMany(items);
    }

    cycle.status = 'Active';
    await cycle.save();

    await logActivity(req.user._id, 'START_AUDIT_CYCLE', 'Audits', `Activated audit cycle ${cycle.title} with ${items.length} items.`, req.ip);

    // Notify assigned auditors
    for (const auditorId of cycle.auditors) {
      await createNotification(auditorId, 'Audit Assigned', `You have been assigned to audit cycle: ${cycle.title}.`, 'Info');
    }

    res.json({ success: true, data: cycle, itemsCount: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all audit cycles
// @route   GET /api/audits
// @access  Private
const getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find({})
      .populate('scopeDepartment', 'name code')
      .populate('auditors', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: cycles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get audit items for a cycle (Auditor dashboard view)
// @route   GET /api/audits/:id/items
// @access  Private
const getAuditItems = async (req, res) => {
  try {
    const items = await AuditItem.find({ auditCycle: req.params.id })
      .populate({
        path: 'asset',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('auditor', 'name email');

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auditor updates an item status during inspection
// @route   PUT /api/audits/items/:itemId
// @access  Private
const verifyAuditItem = async (req, res) => {
  try {
    const { status, notes } = req.body; // Status: Verified, Missing, Damaged
    const item = await AuditItem.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Audit item not found' });
    }

    // Verify cycle is active
    const cycle = await AuditCycle.findById(item.auditCycle);
    if (!cycle || cycle.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Audits can only be logged for active cycles' });
    }

    item.status = status;
    item.notes = notes || '';
    item.auditor = req.user._id;
    item.verifiedAt = Date.now();
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Close Audit Cycle (locks and updates discrepancy states on Assets)
// @route   PUT /api/audits/:id/close
// @access  Private/Admin
const closeAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle || cycle.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Audit cycle not found or is not currently active' });
    }

    // Fetch items that were audited
    const items = await AuditItem.find({ auditCycle: cycle._id });

    let verifiedCount = 0;
    let missingCount = 0;
    let damagedCount = 0;
    let pendingCount = 0;

    for (const item of items) {
      const asset = await Asset.findById(item.asset);
      if (!asset) continue;

      if (item.status === 'Verified') {
        verifiedCount++;
      } else if (item.status === 'Missing') {
        missingCount++;
        // Automatically flip asset status to Lost
        asset.status = 'Lost';
        await asset.save();
      } else if (item.status === 'Damaged') {
        damagedCount++;
        // Update condition to Poor
        asset.condition = 'Poor';
        await asset.save();
      } else {
        pendingCount++;
      }
    }

    // Mark cycle completed
    cycle.status = 'Completed';
    await cycle.save();

    await logActivity(
      req.user._id,
      'CLOSE_AUDIT_CYCLE',
      'Audits',
      `Closed audit cycle: ${cycle.title}. Verified: ${verifiedCount}, Missing (Lost): ${missingCount}, Damaged: ${damagedCount}, Unaudited: ${pendingCount}`,
      req.ip
    );

    res.json({
      success: true,
      data: cycle,
      report: {
        verified: verifiedCount,
        missing: missingCount,
        damaged: damagedCount,
        pending: pendingCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAuditCycle,
  startAuditCycle,
  getAuditCycles,
  getAuditItems,
  verifyAuditItem,
  closeAuditCycle,
};
