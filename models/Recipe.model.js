const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false  // Allow null for anonymous users
    },
    authorName: { 
        type: String, 
        required: true,
        trim: true
    },
    authorEmail: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ingredients: [{ type: String }],
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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [commentSchema]
}, {
    timestamps: true 
});

module.exports = mongoose.model('Recipe', recipeSchema);