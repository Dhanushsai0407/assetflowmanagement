const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const logActivity = require('../utils/logger');
const qr = require('qrcode');

// @desc    Register a new asset
// @route   POST /api/assets
// @access  Private/AssetManager
const registerAsset = async (req, res) => {
  try {
    const {
      name,
      serialNumber,
      category,
      customCategoryName,
      department,
      customDepartmentName,
      location,
      acquisitionDate,
      acquisitionCost,
      warrantyExpiration,
      vendor,
      condition,
      bookable,
      customData,
    } = req.body;

    // Sequential tag generation
    const lastAsset = await Asset.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastAsset && lastAsset.assetTag) {
      const match = lastAsset.assetTag.match(/AF-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const assetTag = 'AF-' + String(nextNum).padStart(6, '0');

    // Generate Base64 QR code representing the asset tag
    const qrCodeUrl = await qr.toDataURL(assetTag);

    // File attachments
    let photoUrl = '';
    const documentUrls = [];
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photoUrl = req.files.photo[0].path;
      }
      if (req.files.documents) {
        req.files.documents.forEach((file) => {
          documentUrls.push(file.path);
        });
      }
    }

    const asset = await Asset.create({
      name,
      assetTag,
      serialNumber: serialNumber || '',
      category: category && category !== 'other' ? category : null,
      customCategoryName: category === 'other' ? customCategoryName : '',
      department: department && department !== 'other' ? department : null,
      customDepartmentName: department === 'other' ? customDepartmentName : '',
      location: location || 'HQ',
      acquisitionDate: acquisitionDate || Date.now(),
      acquisitionCost: acquisitionCost || 0,
      warrantyExpiration: warrantyExpiration || null,
      vendor: vendor || '',
      condition: condition || 'Excellent',
      status: 'Available',
      bookable: bookable === 'true' || bookable === true,
      photoUrl,
      documentUrls,
      qrCodeUrl,
      customData: customData ? JSON.parse(customData) : {},
    });

    await logActivity(req.user._id, 'REGISTER_ASSET', 'Assets', `Asset registered: ${asset.name} (${asset.assetTag})`, req.ip);

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all assets with search and filtering
// @route   GET /api/assets
// @access  Private
const getAssets = async (req, res) => {
  try {
    const { search, category, status, department, location, condition, bookable } = req.query;

    const query = {};

    // Search by asset tag, name, serial number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (department) query.department = department;
    if (location) query.location = location;
    if (condition) query.condition = condition;
    if (bookable !== undefined) query.bookable = bookable === 'true';

    const assets = await Asset.find(query)
      .populate('category', 'name customFields')
      .populate('department', 'name code');

    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single asset detail with timeline history
// @route   GET /api/assets/:id
// @access  Private
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('category', 'name customFields')
      .populate('department', 'name code');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Fetch allocation history
    const allocationHistory = await Allocation.find({ asset: asset._id })
      .populate('allocatedTo', 'name email')
      .populate('allocatedBy', 'name email')
      .populate('allocatedDepartment', 'name code')
      .sort({ createdAt: -1 });

    // Fetch maintenance history
    const maintenanceHistory = await MaintenanceRequest.find({ asset: asset._id })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        asset,
        history: {
          allocations: allocationHistory,
          maintenance: maintenanceHistory,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update asset details
// @route   PUT /api/assets/:id
// @access  Private/AssetManager
const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const {
      name,
      serialNumber,
      category,
      customCategoryName,
      department,
      customDepartmentName,
      location,
      acquisitionDate,
      acquisitionCost,
      warrantyExpiration,
      vendor,
      condition,
      status,
      bookable,
      customData,
    } = req.body;

    asset.name = name || asset.name;
    asset.serialNumber = serialNumber || asset.serialNumber;
    
    if (category) {
      asset.category = category !== 'other' ? category : null;
      asset.customCategoryName = category === 'other' ? customCategoryName : '';
    }
    
    if (department !== undefined) {
      asset.department = (department && department !== 'other') ? department : null;
      asset.customDepartmentName = department === 'other' ? customDepartmentName : '';
    }
    
    asset.location = location || asset.location;
    asset.acquisitionDate = acquisitionDate || asset.acquisitionDate;
    asset.acquisitionCost = acquisitionCost !== undefined ? acquisitionCost : asset.acquisitionCost;
    asset.warrantyExpiration = warrantyExpiration !== undefined ? warrantyExpiration : asset.warrantyExpiration;
    asset.vendor = vendor || asset.vendor;
    asset.condition = condition || asset.condition;
    asset.status = status || asset.status;
    if (bookable !== undefined) asset.bookable = bookable === 'true' || bookable === true;
    if (customData) asset.customData = JSON.parse(customData);

    // Re-verify file attachments
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        asset.photoUrl = req.files.photo[0].path;
      }
      if (req.files.documents) {
        req.files.documents.forEach((file) => {
          asset.documentUrls.push(file.path);
        });
      }
    }

    const updatedAsset = await asset.save();
    await logActivity(req.user._id, 'UPDATE_ASSET', 'Assets', `Asset updated: ${asset.name} (${asset.assetTag})`, req.ip);

    res.json({ success: true, data: updatedAsset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private/AssetManager
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Check if asset is allocated or under maintenance
    if (['Allocated', 'Reserved', 'Under Maintenance'].includes(asset.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete asset in state: ${asset.status}`,
      });
    }

    await Asset.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'DELETE_ASSET', 'Assets', `Asset deleted: ${asset.name} (${asset.assetTag})`, req.ip);

    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
};
