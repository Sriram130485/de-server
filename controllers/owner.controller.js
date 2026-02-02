const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Trip = require("../models/Trip");
const Booking = require("../models/Booking");
const TripRequest = require("../models/TripRequest");

// Register a new vehicle
exports.registerVehicle = async (req, res) => {
  try {
    const {
      userId,
      make,
      model,
      plate,
      year,
      color,
      vehicleImage,
      rcCertificate,
      pollutionCertificate,
      servicePreferences
    } = req.body;

    // Validate required fields
    if (!userId || !make || !model || !plate || !vehicleImage) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if plate already exists
    const existingVehicle = await Vehicle.findOne({ plate });
    if (existingVehicle) {
      return res.status(400).json({ message: "Vehicle with this license plate already exists" });
    }

    // Create Vehicle
    const newVehicle = new Vehicle({
      owner: userId,
      make,
      model,
      plate,
      year,
      color,
      vehicleImage, // URL from frontend
      documents: {
        rc: rcCertificate, // URL from frontend
        pollution: pollutionCertificate // URL from frontend
      },
      servicePreferences
    });

    await newVehicle.save();

    // Update User Role to include 'owner' if not present
    if (!user.roles.includes('owner')) {
      user.roles.push('owner');
      await user.save();
    }

    res.status(201).json({
      message: "Vehicle registered successfully",
      vehicle: newVehicle,
      userRoles: user.roles
    });

  } catch (error) {
    console.error("Register Vehicle Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get vehicle for the logged-in user
exports.getVehicle = async (req, res) => {
  try {
    const { userId } = req.query; // Or req.user.id if using auth middleware properly

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const vehicle = await Vehicle.findOne({ owner: userId });

    if (!vehicle) {
      return res.status(404).json({ message: "No vehicle found" });
    }

    res.status(200).json({ vehicle });
  } catch (error) {
    console.error("Get Vehicle Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get ALL vehicles for the logged-in user (for Trip Selection)
exports.getVehicles = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const vehicles = await Vehicle.find({ owner: userId });
    res.status(200).json({ vehicles });
  } catch (error) {
    console.error("Get Vehicles Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // 1. Find all trips associated with this vehicle
    const trips = await Trip.find({ vehicle: vehicleId });
    const tripIds = trips.map(trip => trip._id);

    // 2. Delete all Bookings and TripRequests associated with these trips
    if (tripIds.length > 0) {
      await Booking.deleteMany({ trip: { $in: tripIds } });
      await TripRequest.deleteMany({ trip: { $in: tripIds } });

      // 3. Delete the trips themselves
      await Trip.deleteMany({ _id: { $in: tripIds } });
    }

    // 4. Delete the vehicle
    const vehicle = await Vehicle.findByIdAndDelete(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.json({ message: "Vehicle and all associated trips, bookings, and requests deleted successfully" });
  } catch (error) {
    console.error("Delete Vehicle Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const updates = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, updates, { new: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle updated successfully", vehicle });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
