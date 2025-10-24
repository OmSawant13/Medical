const express = require('express');
const router = express.Router();
const { upload, getFileById, getFileStream, deleteFile } = require('../config/gridfs');

// POST /api/images/upload - Upload image to file system
router.post('/upload', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imageUrl = `http://localhost:3000/api/images/${req.file.filename}`;

        console.log('Image uploaded successfully:', req.file.filename);

        res.json({
            success: true,
            imageId: req.file.filename,
            imageUrl: imageUrl,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    });
});

// GET /api/images/:filename - Get image from file system
router.get('/:filename', async(req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        console.log('Requesting image:', filename);

        if (!getFileById(filename)) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Set appropriate headers
        res.set({
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000', // 1 year cache
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        });

        // Stream the file
        const readStream = getFileStream(filename);
        readStream.pipe(res);

        readStream.on('error', (error) => {
            console.error('Error streaming image:', error);
            res.status(500).json({ error: 'Error streaming image' });
        });
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
});

// DELETE /api/images/:id - Delete image from GridFS
router.delete('/:id', async(req, res) => {
    try {
        const file = await getFileById(req.params.id);

        if (!file) {
            return res.status(404).json({ error: 'Image not found' });
        }

        await deleteFile(req.params.id);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// GET /api/images/:id/info - Get image metadata
router.get('/:id/info', async(req, res) => {
    try {
        const file = await getFileById(req.params.id);

        if (!file) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.json({
            id: file._id,
            filename: file.filename,
            contentType: file.contentType,
            length: file.length,
            uploadDate: file.uploadDate,
            metadata: file.metadata
        });
    } catch (error) {
        console.error('Error getting image info:', error);
        res.status(500).json({ error: 'Failed to get image info' });
    }
});

module.exports = router;