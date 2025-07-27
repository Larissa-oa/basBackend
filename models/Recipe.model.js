const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ingredients: [{ type: String, required: true }],
    instructions: { type: String, required: true },
    prepTime: { type: Number },
    cookTime: { type: Number },
    servings: { type: Number },
    headerImage: { type: String },
    processImages: [
        {
          type: String,
          required: false,
          trim: true,
        }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Recipe', recipeSchema);