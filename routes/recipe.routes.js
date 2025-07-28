const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe.model');
const { upload, deleteImage, getPublicIdFromUrl } = require('../middleware/multer.middleware');
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
        headerImage: req.files.headerImage ? req.files.headerImage[0].path : null,
        processImages: req.files.processImages ? req.files.processImages.map(file => file.path) : [],
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
      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

      const updateData = { ...req.body };
      
      // Handle header image update
      if (req.files.headerImage) {
        // Delete old header image from Cloudinary
        if (recipe.headerImage) {
          const publicId = getPublicIdFromUrl(recipe.headerImage);
          await deleteImage(publicId);
        }
        updateData.headerImage = req.files.headerImage[0].path;
      }
      
      // Handle process images update
      if (req.files.processImages) {
        // Delete old process images from Cloudinary
        if (recipe.processImages && recipe.processImages.length > 0) {
          for (const imageUrl of recipe.processImages) {
            const publicId = getPublicIdFromUrl(imageUrl);
            await deleteImage(publicId);
          }
        }
        updateData.processImages = req.files.processImages.map(file => file.path);
      }

      const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.status(200).json(updatedRecipe);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Recipe
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Delete images from Cloudinary
    if (recipe.headerImage) {
      const publicId = getPublicIdFromUrl(recipe.headerImage);
      await deleteImage(publicId);
    }
    
    if (recipe.processImages && recipe.processImages.length > 0) {
      for (const imageUrl of recipe.processImages) {
        const publicId = getPublicIdFromUrl(imageUrl);
        await deleteImage(publicId);
      }
    }

    await Recipe.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
