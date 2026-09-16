const Department = require('../models/Department');
const Category = require('../models/Category');
const User = require('../models/User');
const logActivity = require('../utils/logger');

// ==========================================
// Department Management
// ==========================================

// @desc    Get all departments
// @route   GET /api/org/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({})
      .populate('departmentHead', 'name email role')
      .populate('parentDepartment', 'name code');
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new department
// @route   POST /api/org/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  try {
    const { name, code, departmentHead, parentDepartment, status } = req.body;

    const deptExists = await Department.findOne({ code: code.toUpperCase() });
    if (deptExists) {
      return res.status(400).json({ success: false, message: 'Department code already exists' });
    }

    const nameExists = await Department.findOne({ name });
    if (nameExists) {
      return res.status(400).json({ success: false, message: 'Department name already exists' });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      departmentHead: departmentHead && departmentHead !== 'other' ? departmentHead : null,
      customHeadName: departmentHead === 'other' ? req.body.customHeadName : '',
      customHeadEmail: departmentHead === 'other' ? req.body.customHeadEmail : '',
      parentDepartment: parentDepartment && parentDepartment !== 'other' ? parentDepartment : null,
      customParentName: parentDepartment === 'other' ? req.body.customParentName : '',
      status: status || 'Active',
    });

    if (departmentHead && departmentHead !== 'other') {
      // Update employee role to Department Head if not already
      await User.findByIdAndUpdate(departmentHead, { 
        role: 'Department Head',
        department: department._id
      });
    }

    await logActivity(req.user._id, 'CREATE_DEPARTMENT', 'OrgSetup', `Department created: ${department.name} (${department.code})`, req.ip);

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a department
// @route   PUT /api/org/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  try {
    const { name, code, departmentHead, parentDepartment, status, customHeadName, customHeadEmail, customParentName } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check code/name uniqueness if changed
    if (code && code.toUpperCase() !== department.code) {
      const codeExists = await Department.findOne({ code: code.toUpperCase() });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Department code already exists' });
      }
      department.code = code.toUpperCase();
    }

    if (name && name !== department.name) {
      const nameExists = await Department.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ success: false, message: 'Department name already exists' });
      }
      department.name = name;
    }

    // Update previous department head role if changed
    if (departmentHead !== undefined && String(departmentHead) !== String(department.departmentHead)) {
      if (department.departmentHead) {
        await User.findByIdAndUpdate(department.departmentHead, { role: 'Employee' });
      }
      if (departmentHead && departmentHead !== 'other') {
        // Set new head role
        await User.findByIdAndUpdate(departmentHead, { 
          role: 'Department Head',
          department: department._id
        });
        department.departmentHead = departmentHead;
        department.customHeadName = '';
        department.customHeadEmail = '';
      } else if (departmentHead === 'other') {
        department.departmentHead = null;
        department.customHeadName = customHeadName || '';
        department.customHeadEmail = customHeadEmail || '';
      } else {
        department.departmentHead = null;
        department.customHeadName = '';
        department.customHeadEmail = '';
      }
    } else if (departmentHead === 'other') {
      department.customHeadName = customHeadName || '';
      department.customHeadEmail = customHeadEmail || '';
    }

    if (parentDepartment !== undefined) {
      department.parentDepartment = parentDepartment && parentDepartment !== 'other' ? parentDepartment : null;
      department.customParentName = parentDepartment === 'other' ? (customParentName || '') : '';
    }

    if (status) {
      department.status = status;
    }

    const updatedDepartment = await department.save();
    await logActivity(req.user._id, 'UPDATE_DEPARTMENT', 'OrgSetup', `Department updated: ${updatedDepartment.name}`, req.ip);

    res.json({ success: true, data: updatedDepartment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// Category Management
// ==========================================

// @desc    Get all categories
// @route   GET /api/org/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/org/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, customFields } = req.body;

    const catExists = await Category.findOne({ name });
    if (catExists) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    const category = await Category.create({
      name,
      description,
      customFields: customFields || [],
    });

    await logActivity(req.user._id, 'CREATE_CATEGORY', 'OrgSetup', `Category created: ${category.name}`, req.ip);

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/org/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, customFields } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name !== category.name) {
      const catExists = await Category.findOne({ name });
      if (catExists) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
      category.name = name;
    }

    category.description = description || category.description;
    if (customFields) {
      category.customFields = customFields;
    }

    const updatedCategory = await category.save();
    await logActivity(req.user._id, 'UPDATE_CATEGORY', 'OrgSetup', `Category updated: ${updatedCategory.name}`, req.ip);

    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/org/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // In a real app we'd check if any assets exist in this category first
    await Category.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'DELETE_CATEGORY', 'OrgSetup', `Category deleted: ${category.name}`, req.ip);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
