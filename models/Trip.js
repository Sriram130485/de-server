const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },
        fromLocation: {
            type: String,
            required: true,
        },
        toLocation: {
            type: String,
            required: true,
        },
        tripDate: {
            type: Date,
            required: true,
        },
        tripTime: {
            type: String, // Storing as string e.g., "10:30 AM" for simplicity, or could vary
            required: true,
        },

        // Type 1: Passenger Trip
        isPassengerTrip: {
            type: Boolean,
            default: false
        },
        pricePerSeat: {
            type: Number,
            required: function () { return this.isPassengerTrip; }
        },
        totalSeats: {
            type: Number,
            required: function () { return this.isPassengerTrip; },
            min: 1
        },
        availableSeats: {
            type: Number,
            default: function () { return this.totalSeats; }
        },

        // Type 2: Driver Required
        isDriverRequired: {
            type: Boolean,
            default: false
        },
        driverPaymentAmount: {
            type: Number,
            required: function () { return this.isDriverRequired; }
        },

        // Type 3: Co-Driver
        isCoDriverRequired: {
            type: Boolean,
            default: false
        },
        coDriver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // General Status
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled'],
            default: 'scheduled'
        },

        // V2 New Fields
        tripType: {
            type: String,
            enum: ['outstation', 'incity', 'roundtrip'],
            default: 'outstation'
        },
        bookingDuration: {
            type: Number, // In hours (for In-City)
            required: function () { return this.tripType === 'incity'; }
        },
        returnDate: {
            type: Date, // For Round Trip
            required: function () { return this.tripType === 'roundtrip'; }
        },
        driverGearType: {
            type: String, // 'manual' or 'automatic'
            enum: ['manual', 'automatic']
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
