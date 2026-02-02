const express = require("express");
const router = express.Router();
const tripController = require("../controllers/trip.controller");

router.post("/", tripController.createTrip);
router.put("/:tripId", tripController.updateTrip);
router.delete("/:tripId", tripController.deleteTrip);
router.get("/list", tripController.getTrips);
router.get("/my-trips", tripController.getMyTrips);

module.exports = router;
