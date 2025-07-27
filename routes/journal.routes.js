const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal.model');
const upload = require('../middleware/multer.middleware');
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
        mainImage: req.files.mainImage ? `/uploads/${req.files.mainImage[0].filename}` : null,
        images: req.files.images ? req.files.images.map(file => `/uploads/${file.filename}`) : []
      };
      const journal = await Journal.create(newJournal);
      res.status(201).json(journal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

// Read All - GET
router.get('/', async (req, res) => {
  try {
    const journals = await Journal.find();
    res.status(200).json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read One - GET
router.get('/:id', async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    res.status(200).json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update - PUT
router.put('/:id',
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const updateData = { ...req.body };
      if (req.files.mainImage) {
        updateData.mainImage = `/uploads/${req.files.mainImage[0].filename}`;
      }
      if (req.files.images) {
        updateData.images = req.files.images.map(file => `/uploads/${file.filename}`);
      }
      const journal = await Journal.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!journal) return res.status(404).json({ message: 'Journal not found' });
      res.status(200).json(journal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

// Delete - DELETE
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const journal = await Journal.findByIdAndDelete(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    res.status(200).json({ message: 'Journal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;