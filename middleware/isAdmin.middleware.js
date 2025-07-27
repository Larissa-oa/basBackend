const isAdmin = (req, res, next) => {
  if (!req.payload || !req.payload.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = isAdmin;