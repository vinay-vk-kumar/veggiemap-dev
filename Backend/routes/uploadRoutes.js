const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// --- Configure Cloudinary ---
// These values come from your .env file / Render environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Configure Multer Storage (Cloudinary) ---
// Files are streamed directly to Cloudinary — no local disk needed
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'veggiemap',           // Images stored in a 'veggiemap' folder on Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
});

// File Filter (Images Only)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// @route   POST /api/upload
// @desc    Upload an image file to Cloudinary
// @access  Public
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // req.file.path is the Cloudinary secure URL when using CloudinaryStorage
        const filePath = req.file.path;

        res.status(201).json({
            message: 'File uploaded successfully',
            filePath: filePath,  // e.g. "https://res.cloudinary.com/your-cloud/image/upload/v1234/veggiemap/image.jpg"
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

module.exports = router;
