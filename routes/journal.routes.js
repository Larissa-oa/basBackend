const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');

// Create - POST
router.post('/',
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const newJournal = {
        ...req.body
      };
      const journal = await Journal.create(newJournal);
      res.status(201).json(journal);
    } catch (error) {
      console.error('Journal creation error:', error);
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
    console.error('Journal fetch error:', error);
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
    console.error('Journal fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Journal
router.put('/:id',
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const journal = await Journal.findById(req.params.id);
      if (!journal) return res.status(404).json({ message: 'Journal not found' });

      const updateData = { ...req.body };
      const updatedJournal = await Journal.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.status(200).json(updatedJournal);
    } catch (error) {
      console.error('Journal update error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Journal
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });

    await Journal.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Journal deleted successfully' });
  } catch (error) {
    console.error('Journal deletion error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
