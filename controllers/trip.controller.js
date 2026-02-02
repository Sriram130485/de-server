const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");

exports.createTrip = async (req, res) => {
    try {
        const {
            userId,
            vehicleId,
            fromLocation,
            toLocation,
            tripDate,
            tripTime,
            isPassengerTrip,
            pricePerSeat,
            totalSeats,
            isDriverRequired,
            driverPaymentAmount,
            isCoDriverRequired,
            tripType,        // New
            bookingDuration, // New (In-City)
            returnDate,      // New (Round Trip)
            driverGearType   // New
        } = req.body;

        // 1. Basic Validation
        if (!userId || !vehicleId || !fromLocation || !toLocation || !tripDate || !tripTime) {
            return res.status(400).json({ message: "Missing basic trip details" });
        }

        // 2. Date Validation (Must be future)
        const [year, month, day] = tripDate.split('-').map(Number);
        const [hours, minutes] = tripTime.split(':').map(Number);

        const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);

        if (dateObj < new Date()) {
            return res.status(400).json({ message: "Trip date cannot be in the past" });
        }

        // 3. Conditional Validation
        if (isPassengerTrip) {
            if (!pricePerSeat || !totalSeats) {
                return res.status(400).json({ message: "Price and Seat count required for passenger trips" });
            }
        }

        if (tripType === 'incity' && !bookingDuration) {
            return res.status(400).json({ message: "Duration is required for In-City trips" });
        }

        if (tripType === 'roundtrip' && !returnDate) {
            return res.status(400).json({ message: "Return date is required for Round Trip" });
        }

        if (isDriverRequired) {
            if (!driverPaymentAmount) {
                return res.status(400).json({ message: "Payment amount required if hiring a driver" });
            }
        }

        // 4. Verify Vehicle Ownership
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found or unauthorized" });
        }

        // 5. Create Trip
        const newTrip = new Trip({
            owner: userId,
            vehicle: vehicleId,
            fromLocation,
            toLocation,
            tripDate: dateObj,
            tripTime,
            isPassengerTrip: tripType === 'incity' ? false : isPassengerTrip, // In-city usually just driver
            pricePerSeat: isPassengerTrip ? pricePerSeat : undefined,
            totalSeats: isPassengerTrip ? totalSeats : undefined,
            availableSeats: isPassengerTrip ? totalSeats : undefined,
            isDriverRequired,
            driverPaymentAmount: isDriverRequired ? driverPaymentAmount : undefined,
            isCoDriverRequired,
            coDriver: req.body.coDriverId,
            tripType: tripType || 'outstation',
            bookingDuration,
            returnDate,
            driverGearType
        });

        await newTrip.save();

        res.status(201).json({ message: "Trip created successfully", trip: newTrip });

    } catch (error) {
        console.error("Create Trip Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const updates = req.body;

        // Add specific validation logic here if needed (e.g. recalculating totals)

        const trip = await Trip.findByIdAndUpdate(tripId, updates, { new: true });
        if (!trip) return res.status(404).json({ message: "Trip not found" });

        res.json({ message: "Trip updated successfully", trip });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        // Soft delete or status update preferred usually, but user asked for DELETE checks
        const trip = await Trip.findByIdAndUpdate(tripId, { status: 'cancelled' }, { new: true });
        if (!trip) return res.status(404).json({ message: "Trip not found" });
        res.json({ message: "Trip cancelled successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMyTrips = async (req, res) => {
    try {
        const { userId } = req.query;
        const trips = await Trip.find({ owner: userId }).populate('vehicle').sort({ tripDate: 1 });
        res.status(200).json({ trips });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/trips
exports.getTrips = async (req, res) => {
    try {
        const { type, userId } = req.query;

        let filter = {};

        // Passenger home
        if (type === "passenger") {
            filter.isPassengerTrip = true;
        }

        // Driver home (THIS WAS MISSING)
        if (type === "driver") {
            filter = {
                owner: userId,
                isDriverRequired: true,
            };
        }

        // Available Jobs for Drivers
        if (type === "job-board") {
            filter = {
                isDriverRequired: true,
                // optionally exclude own trips: owner: { $ne: userId }
            };
        }

        // Available Jobs for Co-Drivers
        if (type === "co-driver-jobs") {
            filter = {
                isCoDriverRequired: true,
            };
        }

        const trips = await Trip.find(filter)
            .populate("owner")
            .populate("vehicle")
            .sort({ createdAt: -1 });

        // Filter out trips where populated fields are null (deleted user or vehicle)
        const validTrips = trips.filter(trip => trip.owner && trip.vehicle);

        res.json({ trips: validTrips });
    } catch (error) {
        console.error("Trip fetch error:", error);
        res.status(500).json({ message: "Failed to fetch trips" });
    }
};



