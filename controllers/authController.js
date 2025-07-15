const userModel = require("../models/user-model");
const ownerModel = require("../models/owner-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    let { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/user-home");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash("error", "Please enter a valid email address.");
      return res.redirect("/user-home");
    }
  
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}:"<>?[\]\\;',./`~]).{8,}$/;
    if (!passwordRegex.test(password)) {
      req.flash(
        "error",
        "Password must be at least 8 characters long and include at least one uppercase letter, one special character, and lowercase letters."
      );
      return res.redirect("/user-home");
    }

    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
      req.flash("error", "User already exists, please login");
      return res.redirect("/user-home");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    let createdUser = new userModel({ fullname, email, password: hash });
    await createdUser.save();

    req.flash("success", "User created successfully!");
    res.redirect("/user-home");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/user-home");
  }
};

const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/");
    }

    let existingUser = await userModel.findOne({ email });
    if (!existingUser) {
      req.flash("error", "User does not exist, please register");
      return res.redirect("/");
    }

    let isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/");
    }

    let token = generateToken(existingUser);
    res.cookie("token", token, { httpOnly: true });
    req.flash("success", "User logged in successfully");
    res.redirect("/shop");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/");
  }
};

const loginOwner = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/owners/login");
    }

    let existingOwner = await ownerModel.findOne({ email });
    if (!existingOwner) {
      req.flash("error", "Owner does not exist");
      return res.redirect("/owners/login");
    }

    let isMatch = await bcrypt.compare(password, existingOwner.password);
    if (!isMatch) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/owners/login");
    }

    let token = jwt.sign(
      { email: existingOwner.email, role: "owner" },
      "OWNER_SECRET_KEY"
    );
    res.cookie("ownerToken", token, { httpOnly: true });

    req.flash("success", "Owner logged in successfully");
    res.redirect("/owners/account");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/owners/login");
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("ownerToken");
  req.flash("success", "Owner logged out successfully");
  res.redirect("/");
};

const isOwnerLoggedIn = async (req, res, next) => {
  if (!req.cookies.ownerToken) {
    req.flash("error", "Please login first");
    return res.redirect("/owners/login");
  }
  try {
    let decoded = jwt.verify(req.cookies.ownerToken, "OWNER_SECRET_KEY");
    let owner = await ownerModel
      .findOne({ email: decoded.email })
      .select("-password");
    if (!owner) {
      req.flash("error", "Owner not found");
      return res.redirect("/owners/login");
    }
    req.owner = owner;
    next();
  } catch (err) {
    req.flash("error", "Something went wrong");
    res.redirect("/owners/login");
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginOwner,
  logout,
  isOwnerLoggedIn,
};
