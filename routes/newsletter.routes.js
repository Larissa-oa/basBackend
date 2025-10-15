const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const isAdmin = require('../middleware/isAdmin.middleware');

// Subscribe to Newsletter - POST /newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('=== NEWSLETTER SUBSCRIBE ===');
    console.log('Email:', email);

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase().trim() });

    if (existingSubscriber) {
      // If exists but unsubscribed, reactivate
      if (!existingSubscriber.isActive) {
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        existingSubscriber.unsubscribedAt = null;
        await existingSubscriber.save();

        console.log('Reactivated subscription:', existingSubscriber.email);
        
        return res.status(200).json({
          message: 'Successfully resubscribed to newsletter!',
          subscriber: {
            email: existingSubscriber.email,
            subscribedAt: existingSubscriber.subscribedAt
          }
        });
      }

      // Already subscribed
      console.log('Email already subscribed:', email);
      return res.status(200).json({
        message: 'You are already subscribed to our newsletter!',
        subscriber: {
          email: existingSubscriber.email,
          subscribedAt: existingSubscriber.subscribedAt
        }
      });
    }

    // Create new subscriber
    const newSubscriber = await Newsletter.create({
      email: email.toLowerCase().trim()
    });

    console.log('New subscriber added:', newSubscriber.email);

    res.status(201).json({
      message: 'Successfully subscribed to newsletter!',
      subscriber: {
        email: newSubscriber.email,
        subscribedAt: newSubscriber.subscribedAt
      }
    });

  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    
    // Handle duplicate key error (in case of race condition)
    if (error.code === 11000) {
      return res.status(200).json({
        message: 'You are already subscribed to our newsletter!'
      });
    }

    res.status(500).json({ 
      message: 'Failed to subscribe to newsletter',
      error: error.message 
    });
  }
});

// Unsubscribe from Newsletter - POST /newsletter/unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('=== NEWSLETTER UNSUBSCRIBE ===');
    console.log('Email:', email);

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find subscriber
    const subscriber = await Newsletter.findOne({ email: email.toLowerCase().trim() });

    if (!subscriber) {
      return res.status(404).json({ 
        message: 'Email not found in our newsletter list' 
      });
    }

    if (!subscriber.isActive) {
      return res.status(200).json({ 
        message: 'You are already unsubscribed from our newsletter' 
      });
    }

    // Unsubscribe
    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    console.log('Unsubscribed:', subscriber.email);

    res.status(200).json({
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ 
      message: 'Failed to unsubscribe from newsletter',
      error: error.message 
    });
  }
});

// Get All Subscribers (Admin only) - GET /newsletter/subscribers
router.get('/subscribers', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { active } = req.query;

    console.log('=== GET SUBSCRIBERS ===');
    console.log('Filter by active:', active);

    // Build filter
    const filter = {};
    if (active === 'true') {
      filter.isActive = true;
    } else if (active === 'false') {
      filter.isActive = false;
    }

    const subscribers = await Newsletter.find(filter).sort({ subscribedAt: -1 });

    const stats = {
      total: subscribers.length,
      active: subscribers.filter(s => s.isActive).length,
      inactive: subscribers.filter(s => !s.isActive).length
    };

    res.status(200).json({
      stats,
      subscribers
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch subscribers',
      error: error.message 
    });
  }
});

// Delete Subscriber (Admin only) - DELETE /newsletter/subscribers/:id
router.delete('/subscribers/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== DELETE SUBSCRIBER ===');
    console.log('Subscriber ID:', id);

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    console.log('Deleted subscriber:', subscriber.email);

    res.status(200).json({
      message: 'Subscriber deleted successfully',
      email: subscriber.email
    });

  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ 
      message: 'Failed to delete subscriber',
      error: error.message 
    });
  }
});

// Get Newsletter Stats (Admin only) - GET /newsletter/stats
router.get('/stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ isActive: true });
    const inactiveSubscribers = await Newsletter.countDocuments({ isActive: false });

    // Get recent subscribers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubscribers = await Newsletter.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo },
      isActive: true
    });

    res.status(200).json({
      total: totalSubscribers,
      active: activeSubscribers,
      inactive: inactiveSubscribers,
      recentSubscriptions: recentSubscribers
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch stats',
      error: error.message 
    });
  }
});

module.exports = router;

