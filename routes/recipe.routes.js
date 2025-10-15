const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const { optionalAuth } = require('../middleware/optionalAuth.middleware');
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

// ============= COMMENT ROUTES =============

// Add Comment to Recipe - POST /recipes/:id/comments
router.post('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, authorName, authorEmail } = req.body;

    console.log('=== ADD COMMENT DEBUG ===');
    console.log('Recipe ID:', id);
    console.log('Comment data:', { text, authorName, authorEmail });
    console.log('User authenticated:', !!req.payload);

    // Validate required fields
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (!authorName || !authorName.trim()) {
      return res.status(400).json({ message: 'Author name is required' });
    }

    // Find the recipe
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Create comment object
    const newComment = {
      text: text.trim(),
      authorName: authorName.trim(),
      authorEmail: authorEmail ? authorEmail.trim() : null,
      author: req.payload ? req.payload._id : null  // Link to user if authenticated
    };

    // Add comment to recipe
    recipe.comments.push(newComment);
    await recipe.save();

    console.log('Comment added successfully');

    // Return the newly added comment
    const addedComment = recipe.comments[recipe.comments.length - 1];
    res.status(201).json({
      message: 'Comment added successfully',
      comment: addedComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get Comments for a Recipe - GET /recipes/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findById(id).select('comments');
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Sort comments by newest first
    const sortedComments = recipe.comments.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      recipeId: id,
      comments: sortedComments,
      count: sortedComments.length
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Comment - DELETE /recipes/:id/comments/:commentId
router.delete('/:id/comments/:commentId', optionalAuth, async (req, res) => {
  try {
    const { id, commentId } = req.params;

    console.log('=== DELETE COMMENT DEBUG ===');
    console.log('Recipe ID:', id);
    console.log('Comment ID:', commentId);
    console.log('User authenticated:', !!req.payload);

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Find the comment
    const comment = recipe.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check authorization
    // Allow deletion if:
    // 1. User is admin
    // 2. User is the comment author (if logged in)
    // 3. Comment was made anonymously and user provides matching email
    const isAdmin = req.payload && req.payload.isAdmin;
    const isAuthor = req.payload && comment.author && 
                     comment.author.toString() === req.payload._id.toString();

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ 
        message: 'You can only delete your own comments' 
      });
    }

    // Remove the comment
    comment.deleteOne();
    await recipe.save();

    console.log('Comment deleted successfully');

    res.status(200).json({ 
      message: 'Comment deleted successfully' 
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
