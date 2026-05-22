const express = require('express');

const router = express.Router();
const routeController = require('../controllers/route.controller');

/**
 * Public Route Routes
 * /api/v1/routes
 */

// Public route search
router.get('/search', routeController.search);

module.exports = router;
