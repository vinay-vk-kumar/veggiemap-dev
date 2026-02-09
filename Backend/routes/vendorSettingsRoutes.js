const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect, vendorOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @route   PUT /api/vendor/settings/profile
// @desc    Update Vendor basic profile (Name, Shop Name, Phone, Hours, etc.)
// @access  Private (Vendor)
router.put('/profile', protect, vendorOnly, async (req, res) => {
    try {
        const { vendorName, shopName, phoneNumber, businessHours, deliveryAvailable, email, shopImage } = req.body;
        const vendorId = req.vendor._id; // Correct usage: Mongo _id from middleware

        // Create updates object
        const updateData = {};
        if (vendorName) updateData.vendorName = vendorName;
        if (shopName) updateData.shopName = shopName;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (businessHours) updateData.businessHours = businessHours;
        if (typeof deliveryAvailable !== 'undefined') updateData.deliveryAvailable = deliveryAvailable;
        if (email) updateData.email = email;
        if (typeof shopImage !== 'undefined') updateData.shopImage = shopImage;

        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedVendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json(updatedVendor);

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: 'Server error updating profile', error: error.message });
    }
});

// @route   PUT /api/vendor/settings/location
// @desc    Update Static Shop Location
// @access  Private (Vendor)
router.put('/location', protect, vendorOnly, async (req, res) => {
    try {
        const { coordinates } = req.body; // Expect [lng, lat]
        const vendorId = req.vendor._id; // Correct usage: Mongo _id from middleware

        if (!coordinates || coordinates.length !== 2) {
            return res.status(400).json({ message: 'Invalid coordinates format. Expected [lng, lat].' });
        }

        // Logic check: ensure vendor is static or allow mobile to set "home base"? 
        // For now, allow all, but typically only relevant for Static.

        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId,
            {
                $set: {
                    location: {
                        type: 'Point',
                        coordinates: coordinates
                    }
                }
            },
            { new: true }
        ).select('location');

        res.json({ message: 'Location updated', location: updatedVendor.location });

    } catch (error) {
        console.error("Location Update Error:", error);
        res.status(500).json({ message: 'Server error updating location' });
    }
});

// @route   PUT /api/vendor/settings/password
// @desc    Change Password
// @access  Private (Vendor)
router.put('/password', protect, vendorOnly, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const vendorId = req.vendor._id; // Correct usage: Mongo _id from middleware

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password.' });
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, vendor.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        vendor.password = await bcrypt.hash(newPassword, salt);
        await vendor.save();

        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error("Password Update Error:", error);
        res.status(500).json({ message: 'Server error updating password' });
    }
});

module.exports = router;
