const express = require('express');

const router = express.Router();
const tripController = require('../controllers/trip.controller');

/**
 * Trip Routes (Public)
 * /api/v1/trips
 *
 * These routes are public for customers to search and view trips
 */

// Search trips
router.get('/search', tripController.search);

// Get trip detail (public)
router.get('/:id', tripController.getPublicTripDetail);

// Get dynamic price for a trip
router.get('/:id/dynamic-price', tripController.getDynamicPrice);

module.exports = router;
