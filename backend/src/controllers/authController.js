const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const logActivity = require('../utils/logger');
const createNotification = require('../utils/notifier');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'assetflow_super_secret_key_123!', {
    expiresIn: '30d',
  });
};

// @desc    Register a new employee
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, department, phone, customDepartmentName, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Employee',
      department: department && department !== 'other' ? department : null,
      customDepartmentName: department === 'other' ? customDepartmentName : '',
      phone,
      status: 'Active',
    });

    if (user) {
      await logActivity(user._id, 'SIGNUP', 'Auth', `User registered: ${user.email}`, req.ip);
      
      // Notify admins
      const admins = await User.find({ role: 'Admin' });
      for (const admin of admins) {
        await createNotification(admin._id, 'New Employee Registered', `${user.name} (${user.email}) has signed up.`, 'Info');
      }

      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        customDepartmentName: user.customDepartmentName,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('department', 'name code');
    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Inactive') {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Admin.' });
      }

      await logActivity(user._id, 'LOGIN', 'Auth', `User logged in: ${user.email}`, req.ip);

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        customDepartmentName: user.customDepartmentName,
        phone: user.phone,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with that email' });
    }
    
    // Simulate email reset or change to a default
    // In local demo context, we will reset password to 'Reset123!'
    user.password = 'Reset123!';
    await user.save();
    
    await logActivity(user._id, 'PASSWORD_RESET_REQUEST', 'Auth', `Password reset requested, temporary password set.`, req.ip);

    res.json({
      success: true,
      message: 'Password reset code sent. (Demo Mode: Password has been set to Reset123!)',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code');
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile & change password
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      await logActivity(user._id, 'UPDATE_PROFILE', 'Auth', `Profile updated by user`, req.ip);

      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          department: updatedUser.department,
          phone: updatedUser.phone,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get employee directory (Users list)
// @route   GET /api/auth/directory
// @access  Private
const getDirectory = async (req, res) => {
  try {
    const users = await User.find({}).populate('department', 'name code');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update employee status/role (Admin only)
// @route   PUT /api/auth/directory/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  try {
    const { role, departmentId, status } = req.body;
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (role) employee.role = role;
    if (status) employee.status = status;
    if (departmentId !== undefined) employee.department = departmentId || null;

    const updatedEmployee = await employee.save();
    
    // Log admin action
    await logActivity(req.user._id, 'UPDATE_EMPLOYEE_ADMIN', 'Directory', `Promoted/Updated employee ${employee.email} to Role: ${role || employee.role}, Status: ${status || employee.status}`, req.ip);
    await createNotification(employee._id, 'Account Updated by Admin', `Your role is now ${employee.role} and department is updated.`, 'Success');

    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  getProfile,
  updateProfile,
  getDirectory,
  updateEmployee,
};
