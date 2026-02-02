const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    profileImage: {
      type: String, // Stores Cloudinary URL
      default: "",
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values to be unique checks (ignore them)
    },
    otp: String,
    otpExpiresAt: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: [String],
      default: ["user"], // user, driver, owner, admin
    },
    // Driver Verification Fields
    isApproved: {
      type: Boolean,
      default: false
    },
    aadharNumber: String,
    panNumber: String,
    licenseNumber: String,
    documentImages: {
      aadharFront: String,
      aadharBack: String,
      panFront: String,
      panBack: String,
      licenseFront: String,
      licenseBack: String
    },
    verificationStatus: {
      dl: { type: Boolean, default: false },
      pan: { type: Boolean, default: false },
      aadhar: { type: Boolean, default: false }
    },
    digilockerAccessToken: String,
    digilockerRetryCount: {
      type: Number,
      default: 0
    },
    digilockerStatus: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
