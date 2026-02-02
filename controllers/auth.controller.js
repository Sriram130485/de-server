const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { generateOTP } = require("../utils/otp");

// SEND OTP (Login Only)
exports.sendOTP = async (req, res) => {
  const { mobile } = req.body;

  const user = await User.findOne({ mobile });
  if (!user) {
    return res.status(404).json({ message: "User not found. Please register first." });
  }

  const otp = generateOTP();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpiresAt = Date.now() + 5 * 60 * 1000;
  await user.save();

  console.log("OTP (Login):", otp);
  res.json({ message: "OTP sent" });
};

// INITIATE REGISTRATION (Step 1 of Wizard)
exports.initiateRegistration = async (req, res) => {
  const { mobile, name } = req.body;

  let user = await User.findOne({ mobile });
  if (user) {
    return res.status(400).json({ message: "Account already exists. Please login." });
  }

  user = await User.create({ mobile, name });

  const otp = generateOTP();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpiresAt = Date.now() + 5 * 60 * 1000;
  await user.save();

  console.log("OTP (Register):", otp);
  res.json({ message: "OTP sent" });
};

// VERIFY OTP
exports.verifyOTP = async (req, res) => {
  const { mobile, otp } = req.body;

  const user = await User.findOne({ mobile });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.otpExpiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  const validOTP = await bcrypt.compare(otp, user.otp);
  if (!validOTP) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const token = jwt.sign(
    { userId: user._id, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  res.json({ token });
};

// ✅ MUST BE A NAMED FUNCTION
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, profileImage } = req.body;

    // Validations could go here

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email, profileImage },
      { new: true } // Return updated document
    );

    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
