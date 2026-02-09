const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/Vendor');
const Consumer = require('../models/Consumer'); // NEW: Import Consumer model
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

// --- Vendor Routes (Existing Logic) ---

// @route   POST /api/auth/vendor/register
// @desc    Register a new vendor
// @access  Public
router.post('/vendor/register', async (req, res) => {
    const { vendorName, shopName, email, password, vendorType, location, phoneNumber } = req.body;

    // 1. Basic validation
    if (!vendorName || !email || !password || !vendorType || !location || !phoneNumber) {
        return res.status(400).json({ message: 'Please include all required fields: name, email, password, type, location, and phone number.' });
    }

    // Check for email collision across both Vendor and Consumer databases
    const existingUser = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'A user or vendor is already registered with this email.' });
    }

    // Check for Phone Number collision (Vendor only)
    const existingPhone = await Vendor.findOne({ phoneNumber });
    if (existingPhone) {
        return res.status(400).json({ message: 'This phone number is already registered.' });
    }

    try {
        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create a temporary user ID
        const newUserId = new mongoose.Types.ObjectId();

        // 4. Create the Vendor document
        const newVendor = await Vendor.create({
            userId: newUserId,
            vendorName,
            shopName: shopName || vendorName, // Default shop name to vendor name if not provided
            email,
            phoneNumber, // Save phone number
            password: hashedPassword,
            vendorType,
            location: {
                type: 'Point',
                coordinates: location.coordinates
            }
        });

        if (newVendor) {
            res.status(201).json({
                _id: newVendor._id,
                vendorName: newVendor.vendorName,
                shopName: newVendor.shopName,
                name: newVendor.vendorName,
                email: newVendor.email,
                phoneNumber: newVendor.phoneNumber,
                vendorType: newVendor.vendorType,
                role: 'vendor',
                userId: newVendor.userId,
                token: generateToken(newVendor.userId),
                location: newVendor.location,
                businessHours: newVendor.businessHours,
                deliveryAvailable: newVendor.deliveryAvailable,
            });
        } else {
            res.status(400).json({ message: 'Invalid vendor data' });
        }
    } catch (error) {
        console.error('Vendor Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// @route   POST /api/auth/vendor/login
// @desc    Authenticate a vendor
// @access  Public
router.post('/vendor/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const vendor = await Vendor.findOne({ email });

    if (vendor && (await bcrypt.compare(password, vendor.password))) {
        res.json({
            _id: vendor._id,
            vendorName: vendor.vendorName,
            shopName: vendor.shopName,
            name: vendor.vendorName,
            email: vendor.email,
            phoneNumber: vendor.phoneNumber,
            vendorType: vendor.vendorType,
            role: 'vendor',
            userId: vendor.userId,
            token: generateToken(vendor.userId),
            location: vendor.location,
            businessHours: vendor.businessHours,
            deliveryAvailable: vendor.deliveryAvailable
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});


// --- Consumer Routes (NEW LOGIC) ---

// @route   POST /api/auth/consumer/register
// @desc    Register a new consumer
// @access  Public
router.post('/consumer/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please include all required fields: name, email, and password.' });
    }

    // Check for email collision across both Vendor and Consumer databases
    const existingUser = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'A user or vendor is already registered with this email.' });
    }

    try {
        // Consumer model uses a pre-save hook to hash the password (see Consumer.js)
        const newUserId = new mongoose.Types.ObjectId();

        const newConsumer = await Consumer.create({
            userId: newUserId,
            name,
            email,
            password // Hashing handled by model hook
        });

        if (newConsumer) {
            res.status(201).json({
                _id: newConsumer._id,
                name: newConsumer.name,
                role: 'consumer', // Indicate role in response
                token: generateToken(newConsumer.userId),
            });
        } else {
            res.status(400).json({ message: 'Invalid consumer data' });
        }
    } catch (error) {
        console.error('Consumer Registration Error:', error);
        res.status(500).json({ message: 'Server error during consumer registration', error: error.message });
    }
});


// @route   POST /api/auth/consumer/login
// @desc    Authenticate a consumer
// @access  Public
router.post('/consumer/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const consumer = await Consumer.findOne({ email });
    console.log(`[Auth] Login attempt for: ${email}`);
    console.log(`[Auth] Consumer found: ${!!consumer}`);
    if (consumer) {
        // console.log(`[Auth] Stored Hash: ${consumer.password}`);
    }

    // Check password against the stored hash
    const isMatch = consumer && (await bcrypt.compare(password, consumer.password));
    console.log(`[Auth] Password match: ${isMatch}`);

    if (isMatch) {
        res.json({
            _id: consumer._id,
            name: consumer.name,
            email: consumer.email,
            role: 'consumer',
            token: generateToken(consumer.userId),
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});


module.exports = router;