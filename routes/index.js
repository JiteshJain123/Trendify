const express = require("express");
const router = express.Router();
const isloggedin = require("../middleware/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

// ✅ Route: choose role
router.get("/", (req, res) => {
  res.render("choose-role", {
    title: "Choose Role",
    hideHamburger: true, 
    loggedIn: false,
    env: process.env.NODE_ENV,
    currentPath: req.path
  });
});

// ✅ Route: user home
router.get("/user-home", (req, res) => {
  res.render("index", {
    title: "User-Home",
    hideHamburger: true,
    loggedIn: req.user ? true : false,
    success: req.session.success,
    error: req.session.error,
    passwordError: req.query.passwordError || null,
    currentPath: req.path
  });
  req.session.success = null;
  req.session.error = null;
});

// ✅ Route: shop
router.get("/shop", isloggedin, async (req, res) => {
  const selectedCategory = req.query.category?.toLowerCase() || "all";
  const filterDiscounted = req.query.sort === "discounted";

  let query = {};
  if (selectedCategory !== "all") query.category = selectedCategory;
  if (filterDiscounted) query.discount = { $gt: 0 };

  const products = await productModel.find(query);
  const allCategories = await productModel.distinct("category");

  res.render("shop", {
    title: "Shop",
    products,
    hideHamburger: false, 
    categories: allCategories,
    activeCategory: selectedCategory,
    sort: req.query.sort || "all",
    loggedIn: true,
    success: req.session.success, 
    error: req.session.error,   
    currentPath: req.path  
  });
  req.session.success = null;
  req.session.error = null;
});

// ✅ Route: contact
router.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact Details",
    hideHamburger: false, 
    loggedIn: true,
    currentPath: req.path
  });
});

// ✅ Route: discounted only
router.get("/shop/discounted", isloggedin, async (req, res) => {
  const products = await productModel.find({ discount: { $gt: 0 } });

  res.render("shop", {
    title: "Discounted Products",
    products,
    activeCategory: "discounted",
    loggedIn: true,
    currentPath: req.path
  });
});

// ✅ Route: cart
router.get("/cart", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
  let totalBill = 0;

  user.cart?.forEach(item => {
    if (item.product?.price !== undefined && item.product?.discount !== undefined) {
      const price = Number(item.product.price);
      const discountPercentage = Number(item.product.discount);
      const discountedPrice = Math.round(price * (1 - discountPercentage / 100)); // 🟢 percentage discount
      const platformFee = 20;
      const quantity = item.quantity;

      const itemTotal = (discountedPrice + platformFee) * quantity;
      totalBill += itemTotal;
    }
  });

  res.render("cart", {
    title: "Cart",
    user,
    bill: totalBill,
    hideHamburger: false, 
    loggedIn: true,
    success: req.session.success,
    error: req.session.error,
    currentPath: req.path
  });

  req.session.success = null;
  req.session.error = null;
});


// ✅ Add to cart
router.get("/addtocart/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let existing = user.cart.find(i => i.product?.toString() === req.params.productid);

  if (existing) existing.quantity += 1;
  else user.cart.push({ product: req.params.productid, quantity: 1 });

  await user.save();
  req.session.success = "Product added to cart";
  res.redirect("/shop");
});

// ✅ Increase qty
router.get("/increaseqty/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let item = user.cart.find(i => i.product?.toString() === req.params.productid);
  if (item) {
    item.quantity += 1;
    await user.save();
  }
  res.redirect("/cart");
});

// ✅ Decrease qty
router.get("/decreaseqty/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let item = user.cart.find(i => i.product?.toString() === req.params.productid);
  if (item && item.quantity > 1) item.quantity -= 1;
  else user.cart = user.cart.filter(i => i.product?.toString() !== req.params.productid);

  await user.save();
  res.redirect("/cart");
});

// ✅ Remove from cart
router.get("/removefromcart/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  user.cart = user.cart.filter(i => i.product?.toString() !== req.params.productid);
  await user.save();
  req.session.success = "Product removed from cart";
  res.redirect("/cart");
});

// ✅ Route: account
router.get("/account", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
  res.render("account", {
    title: "User Account",
    user,
    hideHamburger: false,
    loggedIn: true,
    success: req.session.success, 
    error: req.session.error,
    currentPath: req.path
  });
  req.session.success = null;
  req.session.error = null;
});

// ✅ Logout
router.get("/logout", isloggedin, (req, res) => {
  res.clearCookie("token");
  req.session.success = "User logged out successfully";
  res.redirect("/");
});

module.exports = router;
