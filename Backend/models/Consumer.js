const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const consumerSchema = new mongoose.Schema({
    // Authentication Fields
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },

    // User Reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },

    // Consumer Profile Details
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Favorites List
    favoriteVendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    }]
}, { timestamps: true });


// --- Middleware: Hash Password before saving ---
consumerSchema.pre('save', async function (next) {
    // Only hash if the password field is being modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error('Error hashing consumer password:', error);
        next(error);
    }
});


const Consumer = mongoose.model('Consumer', consumerSchema);

module.exports = Consumer;