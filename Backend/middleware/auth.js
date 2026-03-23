const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
// Separate secret exclusively for admin tokens — never shared with normal users
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const Vendor = require('../models/Vendor');

/**
 * Middleware to verify JWT and attach user data to the request.
 * Allows access for both Vendor and Consumer roles.
 * Uses JWT_SECRET (normal user secret).
 */
const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
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
 */
const vendorOnly = async (req, res, next) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.userId });
        if (vendor) {
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

/**
 * Middleware exclusively for admin routes.
 * Verifies the token against ADMIN_JWT_SECRET (completely separate from normal JWT_SECRET).
 * Admin tokens cannot be used on normal user routes and vice-versa.
 */
const adminProtect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Verify with the ADMIN-ONLY secret key
            const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

            if (decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Admin access only.' });
            }

            req.adminId = decoded.id;
            next();
        } catch (error) {
            console.error('Admin Auth Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, admin token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no admin token.' });
    }
};

module.exports = { protect, vendorOnly, adminProtect };