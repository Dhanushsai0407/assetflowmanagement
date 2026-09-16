const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/orgController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Departments
router.route('/departments')
  .get(protect, getDepartments)
  .post(protect, authorize('Admin'), createDepartment);

router.route('/departments/:id')
  .put(protect, authorize('Admin'), updateDepartment);

// Categories
router.route('/categories')
  .get(protect, getCategories)
  .post(protect, authorize('Admin'), createCategory);

router.route('/categories/:id')
  .put(protect, authorize('Admin'), updateCategory)
  .delete(protect, authorize('Admin'), deleteCategory);

module.exports = router;
