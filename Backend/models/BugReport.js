const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    imageUrl: {
        type: String, // relative path e.g. /uploads/bug-1234.png
        default: null
    },
    reportedBy: {
        userId: { type: String, required: true },
        email:  { type: String, required: true },
        role:   { type: String, enum: ['vendor', 'consumer'], required: true }
    },
    status: {
        type: String,
        enum: ['open', 'in-review', 'resolved'],
        default: 'open'
    }
}, { timestamps: true });

const BugReport = mongoose.model('BugReport', bugReportSchema);
module.exports = BugReport;
