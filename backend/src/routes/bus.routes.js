const express = require('express');

const router = express.Router();
const busController = require('../controllers/bus.controller');

/**
 * Public Bus Routes
 * /api/v1/buses
 */

// Search buses (public)
router.get('/search', busController.search);

// Seat layout templates (public - for operators to use when creating buses)
router.get('/seat-layout/templates', busController.getAllSeatLayoutTemplates);
router.get('/seat-layout/templates/:busType', busController.getTemplatesByType);
router.get('/seat-layout/templates/:busType/:templateKey', busController.getSpecificTemplate);

// Seat layout utilities (public)
router.post('/seat-layout/build', busController.buildSeatLayout);
router.post('/seat-layout/validate', busController.validateSeatLayout);

module.exports = router;
