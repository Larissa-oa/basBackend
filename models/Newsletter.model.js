const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    unsubscribedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
newsletterSchema.index({ email: 1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);

