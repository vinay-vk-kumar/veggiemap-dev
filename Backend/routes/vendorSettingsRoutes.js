const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect, vendorOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

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
        if (typeof shopImage !== 'undefined') updateData.shopImage = shopImage;

        if (email && email !== req.vendor.email) {
            return res.status(400).json({ message: 'Email cannot be updated directly. Please use the secure email change process.' });
        }

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

router.put('/email', protect, vendorOnly, async (req, res) => {
    try {
        const { newEmail, otp } = req.body;
        const vendorId = req.vendor._id;

        if (!newEmail || !otp) return res.status(400).json({ message: 'New email and OTP are required.' });

        // Check if email is already taken
        const existingVendor = await Vendor.findOne({ email: newEmail });
        const existingConsumer = await require('../models/Consumer').findOne({ email: newEmail });

        if (existingVendor || existingConsumer) {
            return res.status(400).json({ message: 'This email is already in use by another account.' });
        }

        // Verify OTP
        const OTPModel = require('../models/OTP');
        const latestOtp = await OTPModel.findOne({ email: newEmail.toLowerCase(), purpose: 'change-email' }).sort({ createdAt: -1 });

        if (!latestOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });
        if (latestOtp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP has expired' });

        if (latestOtp.attempts >= 5) {
            await OTPModel.deleteOne({ _id: latestOtp._id });
            return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        const isMatch = await bcrypt.compare(otp, latestOtp.otp);
        if (!isMatch) {
            latestOtp.attempts += 1;
            await latestOtp.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Update email
        const vendor = await Vendor.findById(vendorId);
        vendor.email = newEmail;
        vendor.isEmailVerified = true;
        await vendor.save();

        await OTPModel.deleteOne({ _id: latestOtp._id });

        res.json({ message: 'Email updated successfully', email: newEmail });
    } catch (error) {
        console.error("Email Update Error:", error);
        res.status(500).json({ message: 'Server error updating email' });
    }
});

router.put('/location', protect, vendorOnly, async (req, res) => {
    try {
        const { coordinates } = req.body; // Expect [lng, lat]
        const vendorId = req.vendor._id; // Correct usage: Mongo _id from middleware

        if (!coordinates || coordinates.length !== 2) {
            return res.status(400).json({ message: 'Invalid coordinates format. Expected [lng, lat].' });
        }

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

router.put('/password', protect, vendorOnly, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const vendorId = req.vendor._id; // Correct usage: Mongo _id from middleware

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password.' });
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        const isGoogleWithoutPassword = vendor.authProvider === 'google' && !vendor.password;

        if (!isGoogleWithoutPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Please provide current password.' });
            }
            // Check current password
            const isMatch = await bcrypt.compare(currentPassword, vendor.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect current password.' });
            }
        }

        if (!newPassword) {
            return res.status(400).json({ message: 'Please provide new password.' });
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
