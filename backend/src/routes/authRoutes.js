const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  getProfile,
  updateProfile,
  getDirectory,
  updateEmployee,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.get('/directory', protect, getDirectory);
router.put('/directory/:id', protect, authorize('Admin'), updateEmployee);

module.exports = router;
