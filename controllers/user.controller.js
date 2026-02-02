const User = require('../models/User');

exports.registerDriver = async (req, res) => {
    try {
        const { userId, aadharNumber, panNumber, licenseNumber, documentImages } = req.body;

        if (!userId || !aadharNumber || !licenseNumber || !documentImages) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.aadharNumber = aadharNumber;
        user.panNumber = panNumber;
        user.licenseNumber = licenseNumber;
        user.documentImages = documentImages;
        user.roles = [...new Set([...user.roles, 'driver'])]; // Add driver role if not present
        user.isApproved = false; // reset to false on new submission

        await user.save();

        res.json({ message: "Driver registration submitted. Waiting for approval.", user });
    } catch (error) {
        console.error("Register Driver Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getDriverStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isRegistered = user.roles.includes('driver');
        let approvalStatus = 'pending';

        if (isRegistered) {
            if (user.isApproved) {
                approvalStatus = 'approved';
            } else {
                approvalStatus = 'pending'; // Default for registered but not approved
            }
        }

        res.json({ isRegistered, approvalStatus });
    } catch (error) {
        console.error("Get Driver Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
