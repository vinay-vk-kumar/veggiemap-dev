const mongoose = require('mongoose');

const searchTagSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    type: {
        type: String,
        enum: ['shop', 'item'],
        required: true
    },

    // Search Fields
    displayText: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    // Metadata for Instant Display
    image: String,
    price: Number, // Only for items
    subText: String, // "Vegetable Vendor" or "from Shop Name"
    isOnline: {
        type: Boolean,
        default: false,
        index: true // Fast filtering
    },

    // Geospatial
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    }
}, { timestamps: true });

// Indexes for High Performance
searchTagSchema.index({ displayText: 'text', slug: 'text' }); // Text Search
searchTagSchema.index({ vendorId: 1 }); // Fast Sync Updates
searchTagSchema.index({ location: '2dsphere' }); // Geo Search (already in schema definition but good to be explicit)

const SearchTag = mongoose.model('SearchTag', searchTagSchema);

module.exports = SearchTag;
