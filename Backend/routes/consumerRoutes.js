const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Consumer = require('../models/Consumer');
const SearchTag = require('../models/SearchTag'); // New Import
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   POST /api/consumer/sync-search
// @desc    Admin: Full Re-sync of Search Index
// @access  Public (Protect in prod)
router.post('/sync-search', async (req, res) => {
    try {
        await SearchTag.deleteMany({});

        const vendors = await Vendor.find({});
        const tags = [];

        for (const vendor of vendors) {
            // Shop Tag
            tags.push({
                userId: vendor.userId,
                vendorId: vendor._id,
                type: 'shop',
                displayText: vendor.shopName || vendor.vendorName,
                slug: (vendor.shopName || vendor.vendorName || "").toLowerCase(),
                image: vendor.shopImage,
                subText: "Vegetable Vendor",
                isOnline: vendor.isOnline,
                location: vendor.location
            });

            // Menu Tags
            if (vendor.menu?.length) {
                vendor.menu.forEach(item => {
                    if (item.itemStatus === 'in-stock') {
                        tags.push({
                            userId: vendor.userId,
                            vendorId: vendor._id,
                            type: 'item',
                            displayText: item.productName,
                            slug: item.productName.toLowerCase(),
                            image: item.image,
                            price: item.pricePerKg,
                            subText: `from ${vendor.shopName || vendor.vendorName}`,
                            isOnline: vendor.isOnline,
                            location: vendor.location
                        });
                    }
                });
            }
        }

        if (tags.length > 0) {
            await SearchTag.insertMany(tags);
        }

        res.json({ message: `Synced ${tags.length} tags.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// @route   GET /api/consumer/search-v2
// @desc    High-Performance Search using SearchTags
// @access  Public
router.get('/search-v2', async (req, res) => {
    const { lat, lng, maxDistance, query } = req.query;

    if (!lat || !lng) return res.status(400).json({ message: "Location required" });

    const center = [parseFloat(lng), parseFloat(lat)];
    const dist = parseInt(maxDistance) || 5000;

    try {
        const pipeline = [];

        // 1. GeoNear on Tags (Limit initial set strictly)
        pipeline.push({
            $geoNear: {
                near: { type: "Point", coordinates: center },
                distanceField: "distance",
                maxDistance: dist,
                spherical: true,
                query: { isOnline: true } // Only Online Vendors!
            }
        });

        // 2. Text/Regex Match (if query exists)
        if (query) {
            pipeline.push({
                $match: {
                    slug: { $regex: query, $options: 'i' }
                }
            });
        }

        // 3. Limit Results
        pipeline.push({ $limit: 20 });

        // 4. Project
        pipeline.push({
            $project: {
                _id: 1,
                vendorId: 1,
                type: 1,
                displayText: 1,
                image: 1,
                price: 1,
                subText: 1,
                distance: 1,
                isOnline: 1
            }
        });

        const results = await SearchTag.aggregate(pipeline);
        console.log(`[Search V2] Query: "${query}", Center: [${center}], Dist: ${dist}, Found: ${results.length}`);

        // Debug: Log first result to check structure if any
        if (results.length > 0) console.log('[Search V2] First match:', results[0].displayText);

        res.json(results);

    } catch (error) {
        console.error("Search V2 Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// @route   GET /api/consumer/search
// @desc    Find available vendors near a coordinate, filtered by product or shop name
// @access  Public
// Query Params: 
//   lat, lng, maxDistance
//   query: Optional search term (Product Name OR Shop Name)
router.get('/search', protect, async (req, res) => {
    const { lat, lng, maxDistance, sw_lat, sw_lng, ne_lat, ne_lng, query } = req.query;

    let pipeline = [];

    // --- 1. Geospatial Query ---
    // Priority: Bounding Box > Radial Search
    if (sw_lat && sw_lng && ne_lat && ne_lng) {
        pipeline.push({
            $match: {
                isOnline: true,
                location: {
                    $geoWithin: {
                        $box: [
                            [parseFloat(sw_lng), parseFloat(sw_lat)], // Bottom-Left (SW)
                            [parseFloat(ne_lng), parseFloat(ne_lat)]  // Top-Right (NE)
                        ]
                    }
                }
            }
        });
    } else if (lat && lng && maxDistance) {
        const maxDistanceM = parseInt(maxDistance, 10);
        const centerLng = parseFloat(lng);
        const centerLat = parseFloat(lat);

        if (isNaN(maxDistanceM) || isNaN(centerLng) || isNaN(centerLat)) {
            return res.status(400).json({ message: 'Invalid numeric parameters provided.' });
        }

        // Fallback to Radial Search
        pipeline.push({
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [centerLng, centerLat]
                },
                distanceField: "distance",
                maxDistance: maxDistanceM,
                spherical: true,
                query: { isOnline: true }
            }
        });
    } else {
        return res.status(400).json({ message: 'Missing location parameters (Bounds or Center/Dist).' });
    }

    // --- 2. Search Logic (Product OR Shop Name) ---
    const searchRegex = query ? new RegExp(query, 'i') : null;

    const projectStage = {
        $project: {
            _id: 1,
            userId: 1,
            vendorName: 1,
            shopName: 1,
            shopImage: 1,
            vendorType: 1,
            location: 1, // Needed for clustering
            isOnline: 1,
            phoneNumber: 1,
            menu: {
                $filter: {
                    input: "$menu",
                    as: "item",
                    cond: {
                        $and: [
                            { $eq: ["$$item.itemStatus", "in-stock"] },
                            query ? {
                                $regexMatch: {
                                    input: "$$item.productName",
                                    regex: query,
                                    options: "i"
                                }
                            } : true
                        ]
                    }
                }
            }
        }
    };

    pipeline.push(projectStage);

    // --- 3. Filter by Category ---
    const { category } = req.query;
    if (category && category !== 'all') {
        const categoryRegex = new RegExp(category, 'i');
        pipeline.push({
            $match: {
                "menu.category": categoryRegex
            }
        });
    }

    try {
        const vendors = await Vendor.aggregate(pipeline).exec();

        // --- 4. Post-Aggregation Filter (Search Query Matches) ---
        const filteredVendors = vendors.filter(v => {
            if (!query) return true;
            const nameMatch = (v.vendorName && v.vendorName.match(searchRegex)) ||
                (v.shopName && v.shopName.match(searchRegex));
            if (nameMatch) return true;
            return v.menu && v.menu.length > 0;
        });

        console.log(`[Search] BoundsOrRadial | Found: ${filteredVendors.length}`);

        res.status(200).json(filteredVendors);

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Server error during search', error: error.message });
    }
});

// @route   POST /api/consumer/favorites/:vendorId
// @desc    Toggle a vendor as favorite (Add/Remove)
// @access  Private (Consumer)
router.post('/favorites/:vendorId', protect, async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        const userId = req.userId; // Fixed: req.userId set by middleware

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        const consumer = await Consumer.findOne({ userId });
        if (!consumer) return res.status(404).json({ message: 'Consumer profile not found' });

        const index = consumer.favoriteVendors.indexOf(vendorId);
        let status;

        if (index === -1) {
            consumer.favoriteVendors.push(vendorId);
            status = 'added';
        } else {
            consumer.favoriteVendors.splice(index, 1);
            status = 'removed';
        }

        await consumer.save();
        res.json({ message: `Vendor ${status} favorites`, favoriteVendors: consumer.favoriteVendors, status });

    } catch (error) {
        console.error('Toggle Favorite Error:', error);
        res.status(500).json({ message: 'Server error updating favorites' });
    }
});

// @route   GET /api/consumer/favorites
// @desc    Get user's favorite vendors
// @access  Private (Consumer)
router.get('/favorites', protect, async (req, res) => {
    try {
        const userId = req.userId; // Fixed: req.userId set by middleware
        const consumer = await Consumer.findOne({ userId }).populate({
            path: 'favoriteVendors',
            select: 'vendorName shopName shopImage isOnline location vendorType userId'
        });

        if (!consumer) return res.status(404).json({ message: 'Consumer profile not found' });

        res.json(consumer.favoriteVendors);

    } catch (error) {
        console.error('Fetch Favorites Error:', error);
        res.status(500).json({ message: 'Server error fetching favorites' });
    }
});

// @route   GET /api/consumer/vendor/:id
// @desc    Get a specific vendor's public details by their User ID (or Mongo ID)
// @access  Public
router.get('/vendor/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        let query = {};

        // Robust check for ID type
        if (mongoose.Types.ObjectId.isValid(idParam)) {
            query = { $or: [{ _id: idParam }, { userId: idParam }] };
        } else {
            query = { userId: idParam };
        }

        const vendor = await Vendor.findOne(query)
            .select('-password -__v -createdAt -updatedAt');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json(vendor);
    } catch (error) {
        console.error('Fetch Vendor Error:', error);
        res.status(500).json({ message: 'Server error fetching vendor details' });
    }
});

// @route   PUT /api/consumer/profile
// @desc    Update consumer profile (Name)
// @access  Private (Consumer)
router.put('/profile', protect, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.userId; // Fixed: req.userId set by middleware

        const consumer = await Consumer.findOne({ userId });
        if (!consumer) {
            return res.status(404).json({ message: 'Consumer profile not found' });
        }

        if (name) consumer.name = name;

        await consumer.save();
        res.json({ message: 'Profile updated', consumer });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

module.exports = router;