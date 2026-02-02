const TripRequest = require('../models/TripRequest');
const Trip = require('../models/Trip');

// POST /api/requests
exports.createRequest = async (req, res) => {
    try {
        const { driverId, tripId, ownerId } = req.body;

        // Validation
        if (!driverId || !tripId || !ownerId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if already requested
        const existingRequest = await TripRequest.findOne({ driver: driverId, trip: tripId });
        if (existingRequest) {
            return res.status(400).json({ message: "You have already requested this trip" });
        }

        // Check for max pending requests
        const pendingRequestsCount = await TripRequest.countDocuments({ driver: driverId, status: 'pending' });
        if (pendingRequestsCount >= 3) {
            return res.status(400).json({ message: "You cannot sent more than 3 pending requests." });
        }

        // Create Request
        const newRequest = new TripRequest({
            driver: driverId,
            trip: tripId,
            owner: ownerId,
            status: 'pending'
        });

        await newRequest.save();

        res.status(201).json({ message: "Trip request sent successfully", request: newRequest });
    } catch (error) {
        console.error("Create Request Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/requests/owner/:ownerId
exports.getOwnerRequests = async (req, res) => {
    try {
        const { ownerId } = req.params;

        const requests = await TripRequest.find({ owner: ownerId, status: 'pending' })
            .populate('driver', 'name email profileImage phone aadharNumber licenseNumber documentImages')
            .populate({
                path: 'trip',
                populate: { path: 'vehicle' } // Nested populate to get vehicle details in the trip
            })
            .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (error) {
        console.error("Get Owner Requests Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/requests/driver/:driverId
exports.getDriverRequests = async (req, res) => {
    try {
        const { driverId } = req.params;
        const requests = await TripRequest.find({ driver: driverId })
            .populate({
                path: 'trip',
                populate: { path: 'vehicle' }
            })
            .populate('owner', 'name profileImage')
            .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (error) {
        console.error("Get Driver Requests Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/requests/:id
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const request = await TripRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Optional: If accepted, maybe update the Trip to show it has a driver?
        // keeping it simple as per prompt for now.

        res.json({ message: `Request ${status}`, request });
    } catch (error) {
        console.error("Update Request Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// DELETE /api/requests/:requestId
exports.deleteRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await TripRequest.findByIdAndDelete(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.json({ message: "Request cancelled successfully" });
    } catch (error) {
        console.error("Delete Request Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
