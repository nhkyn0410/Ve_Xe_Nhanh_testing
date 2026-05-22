const express = require('express');

const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Employee Routes
 * Base path: /api/v1/employees
 */

// Public routes
/**
 * @route   POST /api/v1/employees/login
 * @desc    Employee login (Trip Manager / Driver)
 * @access  Public
 */
router.post('/login', employeeController.login);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   GET /api/v1/employees/my-trips
 * @desc    Get trips assigned to logged-in employee
 * @access  Private (Employee)
 */
router.get('/my-trips', employeeController.getMyTrips);

module.exports = router;
