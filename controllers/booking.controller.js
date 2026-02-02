const Booking = require("../models/Booking");
const Trip = require("../models/Trip");

// Create a new booking request
exports.createBooking = async (req, res) => {
    try {
        const { tripId, userId, seatsRequested, totalPrice } = req.body;

        // Validation
        if (!tripId || !userId || !totalPrice) {
            return res.status(400).json({ message: "Missing booking details" });
        }

        // Check for duplicate booking
        const existingBooking = await Booking.findOne({ trip: tripId, passenger: userId, status: { $in: ['pending', 'approved'] } });
        if (existingBooking) {
            return res.status(400).json({ message: "You have already requested to join this trip." });
        }

        const newBooking = new Booking({
            trip: tripId,
            passenger: userId,
            seatsRequested,
            totalPrice
        });

        await newBooking.save();

        res.status(201).json({ message: "Request sent successfully!", booking: newBooking });

    } catch (error) {
        console.error("Create Booking Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update booking status (Approve/Reject)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status update" });
        }

        const booking = await Booking.findById(bookingId).populate('trip');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (status === 'approved') {
            // Check availability
            const trip = await Trip.findById(booking.trip._id);
            if (trip.availableSeats < booking.seatsRequested) {
                return res.status(400).json({ message: "Not enough seats available to approve this request." });
            }

            // Decrement seats
            trip.availableSeats = trip.availableSeats - booking.seatsRequested;
            await trip.save();
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({ message: `Booking ${status} successfully`, booking });

    } catch (error) {
        console.error("Update Booking Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get bookings for a specific trip (For Owner to view requests)
exports.getTripBookings = async (req, res) => {
    try {
        const { tripId } = req.params;
        const bookings = await Booking.find({ trip: tripId }).populate('passenger', 'name email profileImage');
        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get my bookings (For Passenger)
exports.getMyBookings = async (req, res) => {
    try {
        const { userId } = req.query;
        const bookings = await Booking.find({ passenger: userId }).populate({
            path: 'trip',
            populate: { path: 'vehicle owner' } // Deep populate
        });
        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
