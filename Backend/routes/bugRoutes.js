const express = require('express');
const router = express.Router();
const BugReport = require('../models/BugReport');
const Vendor = require('../models/Vendor');
const Consumer = require('../models/Consumer');
const { protect, adminProtect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Multer setup (reuse same uploads folder) ──────────────────────────────────
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'bug-' + unique + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ── Helper: resolve email + role from userId ──────────────────────────────────
const resolveReporter = async (userId) => {
    const vendor = await Vendor.findOne({ userId }).select('email');
    if (vendor) return { email: vendor.email, role: 'vendor' };
    const consumer = await Consumer.findOne({ userId }).select('email');
    if (consumer) return { email: consumer.email, role: 'consumer' };
    return null;
};

// ── POST /api/bugs — Submit a bug (any authenticated user) ────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }

        const reporter = await resolveReporter(req.userId);
        if (!reporter) {
            return res.status(404).json({ message: 'Reporter not found.' });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const bug = await BugReport.create({
            title,
            description,
            imageUrl,
            reportedBy: {
                userId: req.userId.toString(),
                email: reporter.email,
                role: reporter.role
            }
        });

        res.status(201).json({ message: 'Bug report submitted successfully.', bug });
    } catch (err) {
        console.error('[BugReport Submit Error]', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ── GET /api/bugs — List all bug reports (admin only) ─────────────────────────
router.get('/', adminProtect, async (req, res) => {
    try {
        const bugs = await BugReport.find().sort({ createdAt: -1 });
        res.json(bugs);
    } catch (err) {
        console.error('[BugReport Fetch Error]', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ── PATCH /api/bugs/:id/status — Cycle status (admin only) ───────────────────
const STATUS_CYCLE = ['open', 'in-review', 'resolved'];
router.patch('/:id/status', adminProtect, async (req, res) => {
    try {
        const bug = await BugReport.findById(req.params.id);
        if (!bug) return res.status(404).json({ message: 'Bug report not found.' });

        const currentIndex = STATUS_CYCLE.indexOf(bug.status);
        const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
        bug.status = nextStatus;
        await bug.save();

        res.json({ message: 'Status updated.', status: bug.status, bug });
    } catch (err) {
        console.error('[BugReport Status Error]', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ── DELETE /api/bugs/:id — Delete a report (admin only) ──────────────────────
router.delete('/:id', adminProtect, async (req, res) => {
    try {
        const bug = await BugReport.findById(req.params.id);
        if (!bug) return res.status(404).json({ message: 'Bug report not found.' });

        // Remove associated image file if it exists
        if (bug.imageUrl) {
            const filePath = path.join(__dirname, '..', bug.imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await bug.deleteOne();
        res.json({ message: 'Bug report deleted successfully.' });
    } catch (err) {
        console.error('[BugReport Delete Error]', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
