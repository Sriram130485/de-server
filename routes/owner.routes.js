const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/owner.controller");

// Route: POST /api/owner/register-vehicle
// Protected routes usually need auth middleware, but user didn't specify strict auth implementation details yet.
// For now, we assume the frontend sends userId in the body as per controller logic.
// Ideally, use a middleware like `verifyToken` here.

router.post("/register-vehicle", ownerController.registerVehicle);
router.get("/my-vehicle", ownerController.getVehicle);
router.get("/my-vehicles", ownerController.getVehicles);
router.delete("/vehicle/:vehicleId", ownerController.deleteVehicle);
router.put("/vehicle/:vehicleId", ownerController.updateVehicle);

module.exports = router;
