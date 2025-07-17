const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");

module.exports = async (req, res, next) => {
  // Check if token exists
  const token = req.cookies.token;
  if (!token) {
    req.session.error = "Please login first";
    return res.redirect("/");
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Find user in DB
    const user = await userModel.findOne({ email: decoded.email }).select("-password");
    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/");
    }

    // Attach user to req object
    req.user = user;
    next();

  } catch (err) {
    console.error("JWT error:", err.message);
    req.session.error = "Something went wrong";
    return res.redirect("/");
  }
};
