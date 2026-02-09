const mongoose = require('mongoose');

// --- 1. Embedded Menu Schema ---
const menuSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    pricePerKg: {
        type: Number,
        required: true,
        min: 0.01 // Prices must be positive
    },
    itemStatus: {
        type: String,
        enum: ['in-stock', 'out-of-stock'],
        default: 'in-stock'
    },
    image: { type: String }, // NEW: URL for product image
    category: {
        type: String,
        enum: ['vegetable', 'fruit', 'other'],
        default: 'vegetable'
    }
}, { _id: true }); // Ensure embedded menu items get their own IDs for easy referencing in updates

// --- 2. Main Vendor Schema ---
const vendorSchema = new mongoose.Schema({
    // Authentication Fields (NEW)
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

    // Authentication Reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        // Since we are not creating a separate User model, we'll use a unique ObjectId here
        required: true,
        unique: true
    },

    // Vendor Status and Type
    // Vendor Status and Type
    vendorName: { type: String, required: true, trim: true }, // Person Name
    shopName: { type: String, trim: true }, // Shop Name (Public)
    phoneNumber: { type: String, trim: true }, // NEW: Contact Number
    deliveryAvailable: { type: Boolean, default: false }, // NEW: Home Delivery Capability
    vendorType: {
        type: String,
        required: true,
        enum: ['static', 'mobile']
    },
    shopImage: { type: String, trim: true }, // NEW: Shop Logo/Image URL
    isOnline: {
        type: Boolean,
        default: false
    },

    // Inventory
    menu: [menuSchema],

    // --- 3. Geospatial Field (Crucial) ---
    location: {
        type: {
            type: String, // Must be 'Point' for GeoJSON Point type
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // Array of [longitude, latitude]
            required: true,
            // index: '2dsphere' // This creates the special geospatial index
        }
    }
}, { timestamps: true });

// --- 4. Enforce Geospatial Index Creation (Safety Check) ---
vendorSchema.index({ location: '2dsphere' });
// Text Index for Search
vendorSchema.index({ shopName: 'text', vendorName: 'text', 'menu.productName': 'text' });

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;