const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");
const multer = require("../middleware/multer.middleware.js");

const saltRounds = 10;

// Signup with optional isAdmin (use cautiously!)
router.post("/signup", (req, res, next) => {
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

  User.findOne({ email })
    .then((foundUser) => {
      if (foundUser) {
        return res.status(400).json({ message: "User already exists." });
      }

      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Cast isAdmin to boolean, default false if not provided
      const adminFlag = isAdmin === true || isAdmin === "true" ? true : false;

      return User.create({ email, password: hashedPassword, name, isAdmin: adminFlag });
    })
    .then((createdUser) => {
      const { email, name, _id, isAdmin } = createdUser;
      const user = { email, name, _id, isAdmin };
      res.status(201).json({ user });
    })
    .catch((err) => next(err));
});

// Login
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    return res.status(400).json({ message: "Provide email and password." });
  }

  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        return res.status(401).json({ message: "User not found." });
      }

      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        const { _id, email, name, isAdmin } = foundUser;
        const payload = { _id, email, name, isAdmin };
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        res.status(200).json({ authToken });
      } else {
        return res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => next(err));
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