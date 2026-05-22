const express = require('express');

const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Complaint Routes (User-facing)
 * /api/v1/complaints
 */

// All routes require authentication
router.use(authenticate);

// User complaint routes
router.post('/', complaintController.createComplaint);
router.get('/', complaintController.getMyComplaints);
router.get('/:id', complaintController.getComplaintById);
router.post('/:id/notes', complaintController.addNote);
router.put('/:id/satisfaction', complaintController.addSatisfactionRating);

module.exports = router;
