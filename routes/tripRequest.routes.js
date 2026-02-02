const express = require('express');
const router = express.Router();
const tripRequestController = require('../controllers/tripRequest.controller');

// POST /api/requests
router.post('/', tripRequestController.createRequest);

// GET /api/requests/owner/:ownerId
router.get('/owner/:ownerId', tripRequestController.getOwnerRequests);

// GET /api/requests/driver/:driverId
router.get('/driver/:driverId', tripRequestController.getDriverRequests);

// PATCH /api/requests/:id
router.patch('/:id', tripRequestController.updateRequestStatus);

// DELETE /api/requests/:requestId
router.delete('/:requestId', tripRequestController.deleteRequest);

module.exports = router;
