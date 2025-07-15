const express = require("express");
const router = express.Router();
const isloggedin = require("../middleware/isloggedin");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

router.get("/", (req, res) => {
  res.render("choose-role", {
    error: req.flash("error"),
    success: req.flash("success"),
    title: "Choose Role",
    loggedIn: false,
    env: process.env.NODE_ENV 
  });
});

router.get("/user-home", (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");
  res.render("index", { error,title: "User-Home", success, loggedIn: false });
});

router.get("/shop", isloggedin, async (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");

  const selectedCategory = req.query.category ? req.query.category.toLowerCase() : "all";
  const filterDiscounted = req.query.sort === "discounted";

  let query = {};
  if (selectedCategory !== "all") {
    query.category = selectedCategory;
  }
  if (filterDiscounted) {
    query.discount = { $gt: 0 };
  }

  const products = await productModel.find(query);

  const allCategories = await productModel.distinct("category");

  res.render("shop", {
    products,
    categories: allCategories,
    activeCategory: selectedCategory, 
    sort: req.query.sort || "all",
    title: "Shop",
    error,
    success,
    loggedIn: true,
  });
});

router.get("/contact", (req, res) => {
  res.render("contact", { error: req.flash("error"),title: "Contact Details", success: req.flash("success"), loggedIn: true });
});

router.get("/shop/discounted", isloggedin, async (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");
  let products = await productModel.find({ discount: { $gt: 0 } });

  res.render("shop", { products, error, success,title: "Discounted Products", loggedIn: true, activeCategory: "discounted" });
});


router.get("/cart", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
  let totalBill = 0;

  if (user.cart && user.cart.length > 0) {
    user.cart.forEach(item => {
      if (item.product && item.product.price !== undefined) {
        let itemTotal = ((Number(item.product.price) + 20) - Number(item.product.discount)) * item.quantity;
        totalBill += itemTotal;
      }
    });
  }

  res.render("cart", { user, bill: totalBill,title: "Cart", error: req.flash("error"), success: req.flash("success"), loggedIn: true });
});

router.get("/addtocart/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let existingProduct = user.cart.find(item => item.product && item.product.toString() === req.params.productid);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    user.cart.push({ product: req.params.productid, quantity: 1 });
  }

  await user.save();
  req.flash("success", "Product added to cart");
  res.redirect("/shop");
});

router.get("/increaseqty/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let item = user.cart.find(i => i.product && i.product.toString() === req.params.productid);
  if (item) {
    item.quantity += 1;
    await user.save();
  }
  res.redirect("/cart");
});

router.get("/decreaseqty/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let item = user.cart.find(i => i.product && i.product.toString() === req.params.productid);
  if (item && item.quantity > 1) {
    item.quantity -= 1;
  } else if (item && item.quantity === 1) {
    user.cart = user.cart.filter(i => i.product && i.product.toString() !== req.params.productid);
  }

  await user.save();
  res.redirect("/cart");
});

router.get("/removefromcart/:productid", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  user.cart = user.cart.filter(i => i.product && i.product.toString() !== req.params.productid);

  await user.save();
  req.flash("success", "Product removed from cart");
  res.redirect("/cart");
});

router.get("/account", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
  res.render("account", { user, error: req.flash("error"),title: "User Account", success: req.flash("success"), loggedIn: true });
});

router.get("/logout", isloggedin, async (req, res) => {
  res.clearCookie("token");
  req.flash("success", "User logged out successfully");
  res.redirect("/");
});

module.exports = router;
