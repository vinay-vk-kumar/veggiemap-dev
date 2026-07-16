const express = require('express');
const router = express.Router();
const { protect, vendorOnly } = require('../middleware/auth');
const Vendor = require('../models/Vendor');
const SearchTag = require('../models/SearchTag');
const mongoose = require('mongoose');

const getGeoRoomName = (lat, lng) => {
    return `geo-${Math.trunc(lat)}-${Math.trunc(lng)}`;
};

const broadcastInventoryUpdate = async (vendorId, io) => {
    try {
        const vendor = await Vendor.findOne({ userId: vendorId });
        if (!vendor) return;

        const [lng, lat] = vendor.location.coordinates;
        const roomName = getGeoRoomName(lat, lng);

        // Broadcast the change to the relevant room
        io.to(roomName).emit('inventory:updated', {
            vendorId: vendor.userId,
            vendorName: vendor.vendorName,
            menu: vendor.menu.filter(item => item.itemStatus === 'in-stock') // Send only in-stock items
        });

        console.log(`[Socket Broadcast] Inventory update triggered for Vendor ID: ${vendorId}, sent to room ${roomName}`);

    } catch (error) {
        console.error('Broadcast Error:', error);
    }
};

router.get('/menu', protect, vendorOnly, async (req, res) => {
    // req.vendor is available from the vendorOnly middleware
    res.status(200).json(req.vendor.menu);
});

router.post('/menu', protect, vendorOnly, async (req, res) => {
    // Expecting: productName, pricePerKg, itemStatus, image, category
    const { productName, pricePerKg, itemStatus, image, category } = req.body;

    // Basic input validation
    if (!productName || pricePerKg === undefined) {
        return res.status(400).json({ message: 'Missing product name or price per Kg.' });
    }

    try {
        const newMenuItem = {
            productName,
            pricePerKg,
            image, // Include image URL
            category, // Include category
            // Default to 'in-stock' if status is not explicitly set
            itemStatus: itemStatus || 'in-stock'
        };

        // Use $push to add the new item to the embedded menu array
        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.vendor._id,
            { $push: { menu: newMenuItem } },
            { new: true, runValidators: true } // Return the updated document and run Mongoose validators
        );

        // Broadcast the change
        const io = req.app.get('socketio');
        await broadcastInventoryUpdate(req.vendor.userId, io);

        // Return the newly created item (which is the last one in the menu array)
        const createdItem = updatedVendor.menu[updatedVendor.menu.length - 1];

        // --- SYNC SEARCH TAG ---
        if (createdItem.itemStatus === 'in-stock') {
            await SearchTag.create({
                userId: req.vendor.userId,
                vendorId: req.vendor._id,
                type: 'item',
                displayText: createdItem.productName,
                slug: createdItem.productName.toLowerCase(),
                image: createdItem.image,
                price: createdItem.pricePerKg,
                subText: `from ${req.vendor.shopName || req.vendor.vendorName}`,
                isOnline: req.vendor.isOnline,
                location: req.vendor.location
            });
        }

        res.status(201).json(createdItem);

    } catch (error) {
        console.error('Menu Creation Error:', error);
        res.status(500).json({ message: 'Server error while adding menu item', error: error.message });
    }
});

router.patch('/menu/:itemId', protect, vendorOnly, async (req, res) => {
    const { itemId } = req.params;
    const updateFields = req.body;

    const update = {};
    for (const key in updateFields) {
        // Construct the update path: 'menu.$[item].<field>'
        update[`menu.$[item].${key}`] = updateFields[key];
    }

    console.log(`[Menu Update] Vendor ${req.vendor._id} Item ${itemId}`);
    console.log(`[Menu Update] Update Payload:`, update);

    try {
        const updatedVendor = await Vendor.findOneAndUpdate(
            {
                _id: req.vendor._id,
                'menu._id': itemId // Find the vendor AND the specific menu item
            },
            { $set: update },
            {
                new: true,
                arrayFilters: [{ 'item._id': itemId }], // Filter to apply update only to the matching item
                runValidators: true
            }
        );

        if (!updatedVendor) {
            return res.status(404).json({ message: 'Menu item not found.' });
        }

        // Broadcast the change
        const io = req.app.get('socketio');
        await broadcastInventoryUpdate(req.vendor.userId, io);

        // Find the updated item to return
        const updatedItem = updatedVendor.menu.find(item => item._id.toString() === itemId);

        // --- SYNC SEARCH TAG ---
        if (updatedItem.itemStatus === 'in-stock') {
            // Re-sync ALL items for this vendor to be safe and simple
            await SearchTag.deleteMany({ vendorId: req.vendor._id, type: 'item' });

            const newTags = updatedVendor.menu
                .filter(i => i.itemStatus === 'in-stock')
                .map(item => ({
                    userId: req.vendor.userId,
                    vendorId: req.vendor._id,
                    type: 'item',
                    displayText: item.productName,
                    slug: item.productName.toLowerCase(),
                    image: item.image,
                    price: item.pricePerKg,
                    subText: `from ${req.vendor.shopName || req.vendor.vendorName}`,
                    isOnline: req.vendor.isOnline,
                    location: req.vendor.location
                }));

            if (newTags.length > 0) await SearchTag.insertMany(newTags);

        } else {
            // Item is out of stock -> Remove it
            // Again, simpler to just Re-sync all.
            await SearchTag.deleteMany({ vendorId: req.vendor._id, type: 'item' });
            const newTags = updatedVendor.menu
                .filter(i => i.itemStatus === 'in-stock')
                .map(item => ({
                    userId: req.vendor.userId,
                    vendorId: req.vendor._id,
                    type: 'item',
                    displayText: item.productName,
                    slug: item.productName.toLowerCase(),
                    image: item.image,
                    price: item.pricePerKg,
                    subText: `from ${req.vendor.shopName || req.vendor.vendorName}`,
                    isOnline: req.vendor.isOnline,
                    location: req.vendor.location
                }));
            if (newTags.length > 0) await SearchTag.insertMany(newTags);
        }

        res.status(200).json(updatedItem);

    } catch (error) {
        console.error('Menu Update Error:', error);
        res.status(500).json({ message: 'Server error while updating menu item', error: error.message });
    }
});

router.delete('/menu/:itemId', protect, vendorOnly, async (req, res) => {
    const { itemId } = req.params;
    const fs = require('fs');
    const path = require('path');

    try {
        // 1. Find the vendor and the item to get the image path
        const vendor = await Vendor.findById(req.vendor._id);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

        const itemToDelete = vendor.menu.find(item => item._id.toString() === itemId);

        // 2. If item has a local image, delete it from disk
        if (itemToDelete && itemToDelete.image) {
            let relativeImagePath = null;

            if (itemToDelete.image.startsWith('/uploads/')) {
                relativeImagePath = itemToDelete.image.substring(1);
            } else if (itemToDelete.image.includes('/uploads/')) {
                const parts = itemToDelete.image.split('/uploads/');
                if (parts.length > 1) {
                    relativeImagePath = 'uploads/' + parts[1];
                }
            }

            if (relativeImagePath) {
                const imagePath = path.join(__dirname, '..', relativeImagePath);
                if (fs.existsSync(imagePath)) {
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error('Failed to delete image file:', err);
                    });
                }
            }
        }

        // 3. Remove the item from DB
        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.vendor._id,
            { $pull: { menu: { _id: itemId } } },
            { new: true }
        );

        // Broadcast the change
        const io = req.app.get('socketio');
        await broadcastInventoryUpdate(req.vendor.userId, io);

        // --- SYNC SEARCH TAG ---
        // Re-sync strategy is safest
        await SearchTag.deleteMany({ vendorId: req.vendor._id, type: 'item' });
        const newTags = updatedVendor.menu
            .filter(i => i.itemStatus === 'in-stock')
            .map(item => ({
                userId: req.vendor.userId,
                vendorId: req.vendor._id,
                type: 'item',
                displayText: item.productName,
                slug: item.productName.toLowerCase(),
                image: item.image,
                price: item.pricePerKg,
                subText: `from ${req.vendor.shopName || req.vendor.vendorName}`,
                isOnline: req.vendor.isOnline,
                location: req.vendor.location
            }));
        if (newTags.length > 0) await SearchTag.insertMany(newTags);

        res.status(200).json({ message: 'Menu item deleted successfully.' });

    } catch (error) {
        console.error('Menu Deletion Error:', error);
        res.status(500).json({ message: 'Server error while deleting menu item', error: error.message });
    }
});


// --- Vendor Status and Location Routes ---
router.patch('/toggle-online', protect, vendorOnly, async (req, res) => {
    const { isOnline } = req.body;
    console.log(`[Toggle Online] Request for Vendor ${req.vendor._id}: ${isOnline}`);

    if (typeof isOnline !== 'boolean') {
        return res.status(400).json({ message: 'Status must be a boolean (true/false).' });
    }

    try {
        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.vendor._id,
            { isOnline }, // Update the renamed field
            { new: true }
        );

        // Broadcast the change
        const io = req.app.get('socketio');
        await broadcastInventoryUpdate(req.vendor.userId, io);

        // --- SYNC SEARCH TAG ---
        // Update ALL tags for this vendor (SHop + Items)
        await SearchTag.updateMany(
            { vendorId: req.vendor._id },
            { $set: { isOnline: isOnline } }
        );

        res.status(200).json({
            isOnline: updatedVendor.isOnline,
            message: `Status updated to ${updatedVendor.isOnline ? 'Online' : 'Offline'}`
        });

    } catch (error) {
        console.error('Status Toggle Error:', error);
        res.status(500).json({ message: 'Server error while toggling status', error: error.message });
    }
});

router.patch('/set-static-loc', protect, vendorOnly, async (req, res) => {
    const { coordinates } = req.body; // Expecting [longitude, latitude]

    if (req.vendor.vendorType !== 'static') {
        return res.status(403).json({ message: 'Only static vendors can use this endpoint.' });
    }
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        return res.status(400).json({ message: 'Invalid coordinates provided. Must be [longitude, latitude].' });
    }

    try {
        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.vendor._id,
            {
                location: {
                    type: 'Point',
                    coordinates: coordinates
                }
            },
            { new: true }
        );

        // Broadcast the change (in case the static location changed)
        const io = req.app.get('socketio');
        await broadcastInventoryUpdate(req.vendor.userId, io);

        // --- SYNC SEARCH TAG ---
        // Update ALL tags location
        await SearchTag.updateMany(
            { vendorId: req.vendor._id },
            { $set: { location: { type: 'Point', coordinates: coordinates } } }
        );

        res.status(200).json({
            location: updatedVendor.location,
            message: 'Static location updated successfully.'
        });

    } catch (error) {
        console.error('Static Location Update Error:', error);
        res.status(500).json({ message: 'Server error while updating static location', error: error.message });
    }
});

router.get('/stats', protect, vendorOnly, async (req, res) => {
    try {
        const vendor = req.vendor;

        // Calculate stats
        const totalItems = vendor.menu.length;
        const activeItems = vendor.menu.filter(item => item.itemStatus === 'in-stock').length;

        const stats = {
            totalItems,
            activeItems,
            views: 0, // Placeholder until we implement tracking
            todayOrders: 0 // Placeholder
        };

        res.json(stats);

    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ message: 'Server error fetching stats', error: error.message });
    }
});

module.exports = router;