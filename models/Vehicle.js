const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    make: {
      type: String, // e.g., Toyota
      required: true,
    },
    model: {
      type: String, // e.g., Camry
      required: true,
    },
    plate: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    year: {
      type: Number,
      required: true,
    },
    color: {
      type: String, // Hex code or name
      required: true,
    },
    vehicleImage: {
      type: String, // Cloudinary URL
      required: true,
    },
    documents: {
      rc: { type: String }, // Cloudinary URL
      pollution: { type: String }, // Cloudinary URL
    },
    servicePreferences: {
      type: [String], // ['Standard', 'Co-Driver', 'Full Driver']
      default: ['Standard']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
