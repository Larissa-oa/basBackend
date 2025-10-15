const jwt = require("jsonwebtoken");

// Optional authentication - doesn't fail if no token, just adds payload if available
const optionalAuth = (req, res, next) => {
  try {
    // Check if there's an authorization header
    if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
      const token = req.headers.authorization.split(" ")[1];
      
      if (token && process.env.TOKEN_SECRET) {
        try {
          const payload = jwt.verify(token, process.env.TOKEN_SECRET);
          req.payload = payload;
        } catch (error) {
          // Token invalid, but we don't fail - just continue without auth
          console.log("Optional auth: Invalid token, continuing as anonymous");
        }
      }
    }
    
    // Continue regardless of whether token was present/valid
    next();
  } catch (error) {
    // Don't fail, just continue without authentication
    next();
  }
};

module.exports = { optionalAuth };

