const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe.model');
const upload = require('../middleware/multer.middleware');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');

// Create Recipe - POST /recipes
router.post('/',
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: 'headerImage', maxCount: 1 },
    { name: 'processImages', maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const newRecipe = {
        ...req.body,
        headerImage: req.files.headerImage ? `/uploads/${req.files.headerImage[0].filename}` : null,
        processImages: req.files.processImages ? req.files.processImages.map(file => `/uploads/${file.filename}`) : [],
        createdBy: req.payload._id
      };
      const recipe = await Recipe.create(newRecipe);
      res.status(201).json(recipe);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get All Recipes
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get One Recipe
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Recipe
router.put('/:id',
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: 'headerImage', maxCount: 1 },
    { name: 'processImages', maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const updateData = { ...req.body };
      if (req.files.headerImage) {
        updateData.headerImage = `/uploads/${req.files.headerImage[0].filename}`;
      }
      if (req.files.processImages) {
        updateData.processImages = req.files.processImages.map(file => `/uploads/${file.filename}`);
      }

      const recipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
      res.status(200).json(recipe);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Recipe
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
