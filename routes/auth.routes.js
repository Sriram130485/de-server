const express = require("express");
const router = express.Router();

const {
  sendOTP,
  initiateRegistration,
  verifyOTP,
  getMe,
  updateProfile,
  deleteAccount,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

// Register Flow
router.post("/register-init", initiateRegistration);
// Login Flow
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.put("/update-profile", authMiddleware, updateProfile);
router.get("/me", authMiddleware, getMe);
router.delete("/delete-account", authMiddleware, deleteAccount);

module.exports = router;
