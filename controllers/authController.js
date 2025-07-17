const userModel = require("../models/user-model");
const ownerModel = require("../models/owner-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      req.session.error = "All fields are required";
      return res.redirect("/user-home");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.session.error = "Please enter a valid email address.";
      return res.redirect("/user-home");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}:"<>?[\]\\;',./`~]).{8,}$/;
    if (!passwordRegex.test(password)) {
      req.session.error = "Password must be at least 8 characters long and include at least one uppercase letter, one special character, and lowercase letters.";
      return res.redirect("/user-home");
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      req.session.error = "User already exists, please login";
      return res.redirect("/user-home");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const createdUser = new userModel({ fullname, email, password: hash });
    await createdUser.save();

    req.session.success = "User created successfully!";
    return res.redirect("/user-home");
  } catch (err) {
    req.session.error = "Something went wrong. Please try again.";
    return res.redirect("/user-home");
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.error = "All fields are required";
      return res.redirect("/");
    }

    const existingUser = await userModel.findOne({ email });
    if (!existingUser) {
      req.session.error = "User does not exist, please register";
      return res.redirect("/");
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      req.session.error = "Invalid credentials";
      return res.redirect("/");
    }

    const token = generateToken(existingUser);
    res.cookie("token", token, { httpOnly: true });

    req.session.success = "User logged in successfully";
    return res.redirect("/shop");
  } catch (err) {
    req.session.error = "Login failed. Please try again.";
    return res.redirect("/");
  }
};

const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.error = "All fields are required";
      return res.redirect("/owners/login");
    }

    const existingOwner = await ownerModel.findOne({ email });
    if (!existingOwner) {
      req.session.error = "Owner does not exist";
      return res.redirect("/owners/login");
    }

    const isMatch = await bcrypt.compare(password, existingOwner.password);
    if (!isMatch) {
      req.session.error = "Invalid credentials";
      return res.redirect("/owners/login");
    }

    const token = jwt.sign(
      { email: existingOwner.email, role: "owner" },
      "OWNER_SECRET_KEY"
    );
    res.cookie("ownerToken", token, { httpOnly: true });

    // Optional: Enable success message
    req.session.success = "Owner logged in successfully";

    return res.redirect("/owners/account");
  } catch (err) {
    req.session.error = "Something went wrong";
    return res.redirect("/owners/login");
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("ownerToken");
  req.session.success = "Owner logged out successfully";
  return res.redirect("/");
};

const isOwnerLoggedIn = async (req, res, next) => {
  if (!req.cookies.ownerToken) {
    req.session.error = "Please login first";
    return res.redirect("/owners/login");
  }
  try {
    const decoded = jwt.verify(req.cookies.ownerToken, "OWNER_SECRET_KEY");
    const owner = await ownerModel.findOne({ email: decoded.email }).select("-password");

    if (!owner) {
      req.session.error = "Owner not found";
      return res.redirect("/owners/login");
    }

    req.owner = owner;
    next();
  } catch (err) {
    req.session.error = "Invalid token or session expired";
    return res.redirect("/owners/login");
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginOwner,
  logout,
  isOwnerLoggedIn,
};
