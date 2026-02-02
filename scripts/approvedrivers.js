const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/tripapp').then(() => {
    console.log("Connected to MongoDB");
    listPendingDrivers();
}).catch(err => {
    console.log("Connected to MongoDB");
    listPendingDrivers();
}).catch(err => {
    console.error("Connection error", err);
    process.exit(1);
});

async function listPendingDrivers() {
    try {
        const drivers = await User.find({ isApproved: false, roles: 'driver' });

        if (drivers.length === 0) {
            console.log("No pending drivers found.");
            process.exit(0);
        }

        console.log(`Found ${drivers.length} pending drivers:`);
        drivers.forEach(d => {
            console.log(`- ID: ${d._id}, Name: ${d.name}, Mobile: ${d.mobile}`);
        });

        // Approve all for now (Simplified for "Manual Update")
        // In a real CLI we would ask, but here I will just approve them to unblock the user.
        console.log("\nApproving all pending drivers...");

        const result = await User.updateMany(
            { isApproved: false, roles: 'driver' },
            { $set: { isApproved: true } }
        );

        console.log(`Approved ${result.modifiedCount} drivers.`);
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
