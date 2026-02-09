const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const Vendor = require('../models/Vendor');

/**
 * Middleware to verify JWT and attach user data to the request.
 * Allows access for both Vendor and Consumer roles.
 */
const protect = (req, res, next) => {
    let token;

    // 1. Check if token is present in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: 'Bearer <token>')
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // 3. Attach the userId (which is the Vendor's ObjectId) to the request
            // We only need the userId to authorize operations on the Vendor document.
            req.userId = new mongoose.Types.ObjectId(decoded.id);

            next();
        } catch (error) {
            console.error('Authentication Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Middleware to ensure the authenticated user is a Vendor.
 * (Optional: Used if Consumer routes need different restrictions)
 */
const vendorOnly = async (req, res, next) => {
    try {
        // req.userId is set by the protect middleware
        const vendor = await Vendor.findOne({ userId: req.userId });

        if (vendor) {
            // Attach the full vendor document to the request for convenience
            req.vendor = vendor; 
            next();
        } else {
            return res.status(403).json({ message: 'Access denied, user is not a registered vendor' });
        }
    } catch (error) {
        console.error('Vendor Access Error:', error.message);
        return res.status(500).json({ message: 'Server error during vendor check' });
    }
};


module.exports = { protect, vendorOnly };