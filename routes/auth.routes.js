const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");
const multer = require("../middleware/multer.middleware.js");
const mongoose = require("mongoose"); // Added for mongoose connection state

const saltRounds = 10;

// Test route to check database connection and create a test user
router.post("/test-setup", async (req, res, next) => {
  try {
    console.log("Testing database connection...");
    
    // Check if TOKEN_SECRET exists
    console.log("TOKEN_SECRET exists:", !!process.env.TOKEN_SECRET);
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
    console.log("Database connection state:", mongoose.connection.readyState);
    
    // Get database info
    const dbName = mongoose.connection.name;
    const dbHost = mongoose.connection.host;
    console.log("Connected to database:", dbName, "on host:", dbHost);
    
    // Check database connection by counting users
    const userCount = await User.countDocuments();
    console.log("Number of users in database:", userCount);
    
    // Get all users to see what's in the database
    const allUsers = await User.find({}).select('email name');
    console.log("All users:", allUsers);
    
    // Create a test user if none exist
    if (userCount === 0) {
      console.log("No users found, creating test user...");
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync("Test123!", salt);
      
      const testUser = await User.create({
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
        isAdmin: false
      });
      
      console.log("Test user created:", testUser.email);
      res.status(200).json({ 
        message: "Test user created successfully",
        user: { email: testUser.email, name: testUser.name },
        credentials: { email: "test@example.com", password: "Test123!" },
        databaseInfo: { name: dbName, host: dbHost, userCount: userCount + 1 }
      });
    } else {
      res.status(200).json({ 
        message: "Database connected successfully",
        userCount: userCount,
        users: allUsers,
        databaseInfo: { name: dbName, host: dbHost }
      });
    }
  } catch (error) {
    console.error("Test setup error:", error);
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

// Test password hashing route
router.post("/test-password", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Provide email and password" });
    }
    
    console.log("=== PASSWORD TEST DEBUG ===");
    console.log("Testing password for email:", email);
    console.log("Input password:", password);
    console.log("Password length:", password.length);
    
    // Find user
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("User found:", user.email);
    console.log("Stored password hash:", user.password);
    console.log("Stored hash length:", user.password.length);
    
    // Test password comparison
    const isCorrect = bcrypt.compareSync(password, user.password);
    console.log("Password comparison result:", isCorrect);
    
    // Test creating a new hash
    const testHash = bcrypt.hashSync(password, 10);
    console.log("New hash of same password:", testHash);
    
    // Test comparing with new hash
    const testComparison = bcrypt.compareSync(password, testHash);
    console.log("Test comparison result:", testComparison);
    
    res.status(200).json({
      message: "Password test completed",
      userEmail: user.email,
      passwordCorrect: isCorrect,
      testHash: testHash.substring(0, 20) + "...",
      testComparison: testComparison
    });
    
  } catch (error) {
    console.error("Password test error:", error);
    res.status(500).json({ message: "Password test failed", error: error.message });
  }
});

// Test Cloudinary configuration
router.get("/test-cloudinary", async (req, res, next) => {
  try {
    const cloudinary = require('cloudinary').v2;
    
    console.log("=== CLOUDINARY TEST ===");
    console.log("Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set"
    });
    
    // Test Cloudinary connection
    const result = await cloudinary.api.ping();
    console.log("Cloudinary ping result:", result);
    
    res.status(200).json({
      message: "Cloudinary test completed",
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
        api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set"
      },
      ping: result
    });
    
  } catch (error) {
    console.error("Cloudinary test error:", error);
    res.status(500).json({ 
      message: "Cloudinary test failed", 
      error: error.message 
    });
  }
});

// Signup with optional isAdmin (use cautiously!)
router.post("/signup", async (req, res, next) => {
  try {
    console.log("=== SIGNUP DEBUG ===");
    console.log("Signup attempt with data:", { email: req.body.email, name: req.body.name });
    console.log("TOKEN_SECRET exists:", !!process.env.TOKEN_SECRET);
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
    console.log("Database connection state:", mongoose.connection.readyState);

    const { email, password, name, isAdmin } = req.body;

    if (email === "" || password === "" || name === "") {
      return res.status(400).json({ message: "Provide email, password and name" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Provide a valid email address." });
    }

    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
      });
    }

    // Check if user already exists
    const foundUser = await User.findOne({ email });
    if (foundUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Cast isAdmin to boolean, default false if not provided
    const adminFlag = isAdmin === true || isAdmin === "true" ? true : false;

    // Create user
    const createdUser = await User.create({ 
      email, 
      password: hashedPassword, 
      name, 
      isAdmin: adminFlag 
    });

    console.log("User created successfully:", createdUser.email);

    const { email: userEmail, name: userName, _id, isAdmin: userIsAdmin } = createdUser;
    const user = { email: userEmail, name: userName, _id, isAdmin: userIsAdmin };
    res.status(201).json({ user });

  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists." });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    next(error);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    console.log("=== LOGIN DEBUG ===");
    console.log("Login attempt for email:", req.body.email);
    console.log("TOKEN_SECRET exists:", !!process.env.TOKEN_SECRET);
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
    console.log("Database connection state:", mongoose.connection.readyState);

    const { email, password } = req.body;

    if (email === "" || password === "") {
      return res.status(400).json({ message: "Provide email and password." });
    }

    // First, let's check what users exist in the database
    const allUsers = await User.find({});
    console.log("All users in database:", allUsers.map(u => ({ email: u.email, name: u.name })));
    
    // Now try to find the specific user
    const foundUser = await User.findOne({ email });
    console.log("User found:", !!foundUser);
    console.log("Found user details:", foundUser ? { email: foundUser.email, name: foundUser.name } : "None");
    
    if (!foundUser) {
      console.log("User not found in database");
      return res.status(401).json({ message: "User not found." });
    }

    console.log("User found, comparing passwords...");
    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);
    console.log("Password correct:", passwordCorrect);

    if (passwordCorrect) {
      const { _id, email: userEmail, name, isAdmin } = foundUser;
      const payload = { _id, email: userEmail, name, isAdmin };
      
      if (!process.env.TOKEN_SECRET) {
        console.error("TOKEN_SECRET is not set!");
        return res.status(500).json({ message: "Server configuration error" });
      }
      
      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "6h",
      });

      console.log("Login successful, token generated");
      res.status(200).json({ authToken });
    } else {
      console.log("Password incorrect");
      return res.status(401).json({ message: "Unable to authenticate the user" });
    }
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error stack:", error.stack);
    next(error);
  }
});

// Verify token
router.get("/verify", isAuthenticated, (req, res, next) => {
  res.status(200).json(req.payload);
});

// PATCH toggle favorite journal
router.patch(
  "/favorites/journals/:journalId",
  isAuthenticated,
  async (req, res, next) => {
    const { journalId } = req.params;
    const userId = req.payload._id;

    try {
      const user = await User.findById(userId);

      if (!user) return res.status(404).json({ message: "User not found." });

      const index = user.favoriteJournals
        ? user.favoriteJournals.findIndex((id) => id.toString() === journalId)
        : -1;

      if (index === -1) {
        user.favoriteJournals = user.favoriteJournals || [];
        user.favoriteJournals.push(journalId);
      } else {
        user.favoriteJournals.splice(index, 1);
      }

      await user.save();
      res.status(200).json({ favoriteJournals: user.favoriteJournals });
    } catch (error) {
      console.error("Error toggling favorite journal:", error);
      next(error);
    }
  }
);

// PATCH toggle favorite recipe (similar to journals)
router.patch(
  "/favorites/recipes/:recipeId",
  isAuthenticated,
  async (req, res, next) => {
    const { recipeId } = req.params;
    const userId = req.payload._id;

    try {
      const user = await User.findById(userId);

      if (!user) return res.status(404).json({ message: "User not found." });

      const index = user.favoriteRecipes
        ? user.favoriteRecipes.findIndex((id) => id.toString() === recipeId)
        : -1;

      if (index === -1) {
        user.favoriteRecipes = user.favoriteRecipes || [];
        user.favoriteRecipes.push(recipeId);
      } else {
        user.favoriteRecipes.splice(index, 1);
      }

      await user.save();
      res.status(200).json({ favoriteRecipes: user.favoriteRecipes });
    } catch (error) {
      console.error("Error toggling favorite recipe:", error);
      next(error);
    }
  }
);

// GET user's favorite recipes (populated)
router.get("/favorites/recipes", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id).populate("favoriteRecipes");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json(user.favoriteRecipes || []);
  } catch (error) {
    console.error("Error fetching favorite recipes:", error);
    next(error);
  }
});

// GET user's favorite journals (populated)
router.get("/favorites/journals", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id).populate("favoriteJournals");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json(user.favoriteJournals || []);
  } catch (error) {
    console.error("Error fetching favorite journals:", error);
    next(error);
  }
});

// DELETE a favorite recipe or journal by ID
router.delete(
  "/favorites/:type/:id",
  isAuthenticated,
  async (req, res, next) => {
    const { type, id } = req.params;
    const userId = req.payload._id;

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found." });

      if (type === "recipes") {
        user.favoriteRecipes = user.favoriteRecipes.filter(
          (recipeId) => recipeId.toString() !== id
        );
      } else if (type === "journals") {
        user.favoriteJournals = user.favoriteJournals.filter(
          (journalId) => journalId.toString() !== id
        );
      } else {
        return res.status(400).json({ message: "Invalid favorite type." });
      }

      await user.save();
      res.status(200).json({ message: `Favorite ${type.slice(0, -1)} removed.` });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      next(error);
    }
  }
);

// PUT update user profile
router.put(
  "/:id",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const userId = req.params.id;

      // Only allow updating own profile
      if (userId !== req.payload._id) {
        return res.status(403).json({ message: "Unauthorized: You can only update your own profile" });
      }

      const { name } = req.body;
      
      // Validate name
      if (!name || name.trim() === "") {
        return res.status(400).json({ message: "Name cannot be empty" });
      }

      if (name.trim().length > 50) {
        return res.status(400).json({ message: "Name cannot exceed 50 characters" });
      }

      const updateData = { name: name.trim() };

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true
      }).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(updatedUser);
      
    } catch (error) {
      console.error("Error updating user profile:", error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: "Validation error", 
          details: Object.values(error.errors).map(e => e.message) 
        });
      }
      
      next(error);
    }
  }
);

module.exports = router; 