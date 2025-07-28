const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal.model');
const { upload, deleteImage, getPublicIdFromUrl } = require('../middleware/multer.middleware');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');

// Create - POST
router.post('/',
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const newJournal = {
        ...req.body,
        mainImage: req.files.mainImage ? req.files.mainImage[0].path : null,
        images: req.files.images ? req.files.images.map(file => file.path) : []
      };
      const journal = await Journal.create(newJournal);
      res.status(201).json(journal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get All Journals
router.get('/', async (req, res) => {
  try {
    const journals = await Journal.find();
    res.status(200).json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get One Journal
router.get('/:id', async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    res.status(200).json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Journal
router.put('/:id',
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const journal = await Journal.findById(req.params.id);
      if (!journal) return res.status(404).json({ message: 'Journal not found' });

      const updateData = { ...req.body };
      
      // Handle main image update
      if (req.files.mainImage) {
        // Delete old main image from Cloudinary
        if (journal.mainImage) {
          const publicId = getPublicIdFromUrl(journal.mainImage);
          await deleteImage(publicId);
        }
        updateData.mainImage = req.files.mainImage[0].path;
      }
      
      // Handle additional images update
      if (req.files.images) {
        // Delete old images from Cloudinary
        if (journal.images && journal.images.length > 0) {
          for (const imageUrl of journal.images) {
            const publicId = getPublicIdFromUrl(imageUrl);
            await deleteImage(publicId);
          }
        }
        updateData.images = req.files.images.map(file => file.path);
      }

      const updatedJournal = await Journal.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.status(200).json(updatedJournal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Journal
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });

    // Delete images from Cloudinary
    if (journal.mainImage) {
      const publicId = getPublicIdFromUrl(journal.mainImage);
      await deleteImage(publicId);
    }
    
    if (journal.images && journal.images.length > 0) {
      for (const imageUrl of journal.images) {
        const publicId = getPublicIdFromUrl(imageUrl);
        await deleteImage(publicId);
      }
    }

    await Journal.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Journal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;