const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");

router.post("/", bookingController.createBooking);
router.put("/:bookingId/status", bookingController.updateBookingStatus);
router.get("/trip/:tripId", bookingController.getTripBookings);
router.get("/my-bookings", bookingController.getMyBookings);

module.exports = router;
