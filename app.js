// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
const express = require("express");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const journalRoutes = require("./routes/journal.routes");
app.use("/journals", journalRoutes);

const recipeRoutes = require("./routes/recipe.routes");
app.use("/recipes", recipeRoutes);

const uploadRoutes = require("./routes/upload.routes");
app.use("/upload", uploadRoutes);

const newsletterRoutes = require("./routes/newsletter.routes");
app.use("/newsletter", newsletterRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
