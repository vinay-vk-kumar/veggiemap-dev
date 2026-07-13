const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/Vendor');
const Consumer = require('../models/Consumer');
const OTP = require('../models/OTP');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- OTP Routes ---

// @route   POST /api/auth/otp/send
// @desc    Send an OTP for verification (limit 3 per day)
router.post('/otp/send', async (req, res) => {
    const { email, purpose } = req.body;
    if (!email || !purpose) return res.status(400).json({ message: 'Email and purpose required' });

    try {
        // Rate Limiting: 3 OTPs per day per email
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const otpCount = await OTP.countDocuments({
            email: email.toLowerCase(),
            createdAt: { $gte: startOfDay }
        });

        if (otpCount >= 3) {
            return res.status(429).json({ message: 'Daily limit of 3 OTP requests exceeded. Try again tomorrow.' });
        }

        // Check if user exists for reset-password
        if (purpose === 'reset-password') {
            const user = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
            if (!user) return res.status(404).json({ message: 'No account found with this email' });
        }

        if (purpose === 'change-email') {
            const existingUser = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
            if (existingUser) return res.status(400).json({ message: 'This email is already registered to another account' });
        }

        const otpCode = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otpCode, salt);

        // Expire in 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60000);

        await OTP.create({
            email: email.toLowerCase(),
            otp: hashedOtp,
            purpose,
            expiresAt
        });

        await sendOTPEmail(email, otpCode, purpose);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error('OTP Send Error:', err);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// @route   POST /api/auth/otp/verify
// @desc    Verify an OTP and handle side effects (reset password, verify email)
router.post('/otp/verify', async (req, res) => {
    const { email, otp, purpose, newPassword } = req.body;
    if (!email || !otp || !purpose) return res.status(400).json({ message: 'Missing fields' });

    try {
        const latestOtp = await OTP.findOne({ email: email.toLowerCase(), purpose }).sort({ createdAt: -1 });

        if (!latestOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

        if (latestOtp.expiresAt < new Date()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        if (latestOtp.attempts >= 5) {
            await OTP.deleteOne({ _id: latestOtp._id });
            return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        const isMatch = await bcrypt.compare(otp, latestOtp.otp);
        if (!isMatch) {
            latestOtp.attempts += 1;
            await latestOtp.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // If purpose is verify-email (from signup), update the user record
        if (purpose === 'verify-email') {
            let user = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
            if (user) {
                user.isEmailVerified = true;
                await user.save();

                // Delete OTP
                await OTP.deleteOne({ _id: latestOtp._id });

                // Send Welcome Email now that they are verified
                const isVendor = !!user.vendorType;
                sendWelcomeEmail(user.email, isVendor ? 'vendor' : 'consumer', user.name || user.vendorName).catch(console.error);

                return res.status(200).json({ 
                    message: 'Email verified successfully',
                    _id: user._id,
                    name: user.name || user.vendorName,
                    vendorName: user.vendorName,
                    shopName: user.shopName,
                    email: user.email,
                    role: isVendor ? 'vendor' : 'consumer',
                    userId: user.userId,
                    token: generateToken(user.userId),
                    hasPassword: !!user.password,
                    ...(isVendor ? {
                        phoneNumber: user.phoneNumber,
                        shopImage: user.shopImage,
                        businessHours: user.businessHours,
                        deliveryAvailable: user.deliveryAvailable,
                        vendorType: user.vendorType,
                        location: user.location,
                        isOnline: user.isOnline
                    } : {})
                });
            }
        }

        if (purpose === 'reset-password') {
            if (!newPassword) return res.status(400).json({ message: 'New password is required' });
            let user = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
            if (!user) return res.status(404).json({ message: 'User not found' });
            
            // Checking instanceof Consumer ensures we trigger the correct model save hooks
            if (user.role === 'consumer' || user instanceof Consumer) {
                user.password = newPassword; 
                await user.save();
            } else {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(newPassword, salt);
                await user.save();
            }
        }

        // Delete the OTP so it can't be reused
        await OTP.deleteOne({ _id: latestOtp._id });

        res.status(200).json({ message: purpose === 'reset-password' ? 'Password reset successfully' : 'OTP verified successfully', verified: true });
    } catch (err) {
        console.error('OTP Verify Error:', err);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
});

// --- Google Auth Route ---

// @route   POST /api/auth/google/login
// @desc    Login or Register via Google
router.post('/google/login', async (req, res) => {
    const { credential, role, action } = req.body; 

    if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let vendorUser = await Vendor.findOne({ email });
        let consumerUser = await Consumer.findOne({ email });

        if (action === 'signin') {
            if (!vendorUser && !consumerUser) {
                return res.status(404).json({ message: 'No account found with this email. Please sign up first.' });
            }
            
            if (role === 'vendor' && !vendorUser) {
                return res.status(403).json({ message: 'You do not have a Vendor account. Please sign in as a Customer or sign up.' });
            }
            if (role === 'consumer' && !consumerUser) {
                return res.status(403).json({ message: 'You do not have a Customer account. Please sign in as a Vendor or sign up.' });
            }

            let user = role === 'vendor' ? vendorUser : consumerUser;

            res.json({
                _id: user._id,
                name: user.name || user.vendorName,
                vendorName: user.vendorName,
                shopName: user.shopName,
                email: user.email,
                role: role,
                userId: user.userId,
                token: generateToken(user.userId),
                hasPassword: !!user.password,
                ...(role === 'vendor' ? {
                    phoneNumber: user.phoneNumber,
                    shopImage: user.shopImage,
                    businessHours: user.businessHours,
                    deliveryAvailable: user.deliveryAvailable,
                    vendorType: user.vendorType,
                    location: user.location,
                    isOnline: user.isOnline
                } : {})
            });

        } else if (action === 'signup') {
            if (vendorUser || consumerUser) {
                const existingRole = vendorUser ? 'Vendor' : 'Customer';
                return res.status(400).json({ message: `This email is already registered as a ${existingRole}. Please sign in.` });
            }

            if (!role) {
                return res.status(400).json({ message: 'Please select a role to sign up.' });
            }

            const newUserId = new mongoose.Types.ObjectId();

            if (role === 'consumer') {
                let user = await Consumer.create({
                    userId: newUserId,
                    name: name,
                    email: email,
                    authProvider: 'google',
                    isEmailVerified: true 
                });

                sendWelcomeEmail(email, 'consumer', name).catch(console.error);

                res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    role: 'consumer',
                    userId: user.userId,
                    token: generateToken(user.userId),
                    hasPassword: !!user.password,
                });
            } else if (role === 'vendor') {
                let user = await Vendor.create({
                    userId: newUserId,
                    vendorName: name,
                    email: email,
                    shopImage: picture,
                    authProvider: 'google',
                    isEmailVerified: true,
                    location: { type: 'Point', coordinates: [0, 0] },
                    vendorType: 'static'
                });

                sendWelcomeEmail(email, 'vendor', name).catch(console.error);

                res.status(201).json({
                    _id: user._id,
                    name: user.vendorName,
                    role: 'vendor',
                    userId: user.userId,
                    token: generateToken(user.userId),
                    hasPassword: !!user.password,
                    requiresCompletion: true
                });
            }
        }
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
});


// --- Vendor Routes (Existing Logic) ---

router.post('/vendor/register', async (req, res) => {
    const { vendorName, shopName, email, password, vendorType, location, phoneNumber } = req.body;

    if (!vendorName || !email || !password || !vendorType || !location || !phoneNumber) {
        return res.status(400).json({ message: 'Please include all required fields.' });
    }

    const existingUser = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

    const existingPhone = await Vendor.findOne({ phoneNumber });
    if (existingPhone) return res.status(400).json({ message: 'Phone number already registered.' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUserId = new mongoose.Types.ObjectId();

        const newVendor = await Vendor.create({
            userId: newUserId,
            vendorName,
            shopName: shopName || vendorName,
            email,
            phoneNumber,
            password: hashedPassword,
            vendorType,
            location: { type: 'Point', coordinates: location.coordinates }
        });

        // Generate and send OTP for email verification
        const otpCode = generateOTP();
        const otpSalt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otpCode, otpSalt);
        await OTP.create({
            email: email.toLowerCase(),
            otp: hashedOtp,
            purpose: 'verify-email',
            expiresAt: new Date(Date.now() + 10 * 60000)
        });

        sendOTPEmail(email, otpCode, 'verify-email').catch(console.error);

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            requiresVerification: true,
            email: newVendor.email
        });
    } catch (error) {
        console.error('Vendor Reg Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

router.post('/vendor/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Provide email and password.' });

    const vendor = await Vendor.findOne({ email });

    // NEW: Check if Google User without password
    if (vendor && vendor.authProvider === 'google' && !vendor.password) {
        return res.status(400).json({ message: 'You signed up with Google. Please use Google to sign in, or reset your password to create one.' });
    }

    if (vendor && !vendor.isEmailVerified) {
        return res.status(403).json({ message: 'Please verify your email before logging in.', requiresVerification: true, email: vendor.email });
    }

    if (vendor && (await bcrypt.compare(password, vendor.password))) {
        res.json({
            _id: vendor._id,
            vendorName: vendor.vendorName,
            shopName: vendor.shopName,
            name: vendor.vendorName,
            email: vendor.email,
            role: 'vendor',
            userId: vendor.userId,
            token: generateToken(vendor.userId),
            hasPassword: !!vendor.password,
            phoneNumber: vendor.phoneNumber,
            shopImage: vendor.shopImage,
            businessHours: vendor.businessHours,
            deliveryAvailable: vendor.deliveryAvailable,
            vendorType: vendor.vendorType,
            location: vendor.location,
            isOnline: vendor.isOnline
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

const { protect } = require('../middleware/auth');

router.post('/vendor/completion', protect, async (req, res) => {
    const { phoneNumber, password, vendorType, location, shopName } = req.body;
    const userId = req.userId;
    
    try {
        const vendor = await Vendor.findOne({ userId });
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        
        const formattedPhone = phoneNumber.startsWith("+91") ? phoneNumber : "+91" + phoneNumber;
        
        const existingPhone = await Vendor.findOne({ phoneNumber: formattedPhone, userId: { $ne: userId } });
        if (existingPhone) {
            return res.status(400).json({ message: 'Phone number is already registered to another account.' });
        }
        
        vendor.phoneNumber = formattedPhone;
        vendor.vendorType = vendorType;
        vendor.location = { type: 'Point', coordinates: location.coordinates };
        if (shopName) vendor.shopName = shopName;
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            vendor.password = await bcrypt.hash(password, salt);
        }
        
        await vendor.save();
        
        res.json({
            _id: vendor._id,
            vendorName: vendor.vendorName,
            shopName: vendor.shopName,
            name: vendor.vendorName,
            email: vendor.email,
            role: 'vendor',
            userId: vendor.userId,
            token: generateToken(vendor.userId),
            hasPassword: !!vendor.password,
            phoneNumber: vendor.phoneNumber,
            shopImage: vendor.shopImage,
            businessHours: vendor.businessHours,
            deliveryAvailable: vendor.deliveryAvailable,
            vendorType: vendor.vendorType,
            location: vendor.location,
            isOnline: vendor.isOnline
        });
    } catch (err) {
        console.error('Vendor Completion Error:', err);
        res.status(500).json({ message: 'Failed to complete profile' });
    }
});

// --- Consumer Routes ---

router.post('/consumer/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ message: 'Please include all required fields.' });

    const existingUser = await Vendor.findOne({ email }) || await Consumer.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

    try {
        const newUserId = new mongoose.Types.ObjectId();
        const newConsumer = await Consumer.create({ userId: newUserId, name, email, password });

        // Generate and send OTP for email verification
        const otpCode = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otpCode, salt);
        await OTP.create({
            email: email.toLowerCase(),
            otp: hashedOtp,
            purpose: 'verify-email',
            expiresAt: new Date(Date.now() + 10 * 60000)
        });

        sendOTPEmail(email, otpCode, 'verify-email').catch(console.error);

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            requiresVerification: true,
            email: newConsumer.email
        });
    } catch (error) {
        console.error('Consumer Reg Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

router.post('/consumer/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Provide email and password.' });

    const consumer = await Consumer.findOne({ email });

    // NEW: Check if Google User without password
    if (consumer && consumer.authProvider === 'google' && !consumer.password) {
        return res.status(400).json({ message: 'You signed up with Google. Please use Google to sign in, or reset your password to create one.' });
    }

    if (consumer && !consumer.isEmailVerified) {
        return res.status(403).json({ message: 'Please verify your email before logging in.', requiresVerification: true, email: consumer.email });
    }

    const isMatch = consumer && (await bcrypt.compare(password, consumer.password));

    if (isMatch) {
        res.json({
            _id: consumer._id,
            name: consumer.name,
            email: consumer.email,
            role: 'consumer',
            token: generateToken(consumer.userId),
            hasPassword: !!consumer.password,
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// --- Admin Login ---
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Invalid admin credentials.' });
    }
    const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Admin authenticated.', token, role: 'admin' });
});

module.exports = router;