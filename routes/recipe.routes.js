const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');

// Create Recipe - POST /recipes
router.post('/',
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const newRecipe = {
        ...req.body,
        createdBy: req.payload._id
      };
      const recipe = await Recipe.create(newRecipe);
      res.status(201).json(recipe);
    } catch (error) {
      console.error('Recipe creation error:', error);
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
    console.error('Recipe fetch error:', error);
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
    console.error('Recipe fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Recipe
router.put('/:id',
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

      const updateData = { ...req.body };
      const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.status(200).json(updatedRecipe);
    } catch (error) {
      console.error('Recipe update error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Recipe
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    await Recipe.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Recipe deletion error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
