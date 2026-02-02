require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
const ownerRoutes = require("./routes/owner.routes");
app.use("/api/owner", ownerRoutes);

const tripRoutes = require("./routes/trip.routes");
app.use("/api/trips", tripRoutes);

const bookingRoutes = require("./routes/booking.routes");
app.use("/api/bookings", bookingRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const tripRequestRoutes = require("./routes/tripRequest.routes");
app.use("/api/requests", tripRequestRoutes);

const digilockerRoutes = require("./routes/digilocker.routes");
app.use("/api/digilocker", digilockerRoutes);

app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB connection failed ❌", err.message);
  });



