const express = require("express");
const router = express.Router();
const { loginOwner, logout, isOwnerLoggedIn } = require("../controllers/authController");
const ownerModel = require("../models/owner-model");
const productModel = require("../models/product-model");
const bcrypt = require("bcrypt");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/register", (req, res) => {
  res.render("owner-register", {
    error: res.locals.error,
    success: res.locals.success,
    title: "Owner Register",
    loggedIn: false,
  });
});

if (process.env.NODE_ENV === "development") {
  router.post("/register", async (req, res) => {
    try {
      const { fullname, email, password, gstin } = req.body;
      if (!fullname || !email || !password || !gstin) {
        req.session.error = "All fields are required";
        return res.redirect("/owners/register");
      }

      const existingOwner = await ownerModel.findOne({ email });
      if (existingOwner) {
        req.session.error = "Owner already exists, please login";
        return res.redirect("/owners/login");
      }

      const hashed = await bcrypt.hash(password, 10);
      const newOwner = new ownerModel({ fullname, email, password: hashed, gstin });
      await newOwner.save();

      req.session.success = "Owner created successfully! Please login.";
      res.redirect("/owners/login");
    } catch (err) {
      req.session.error = err.message;
      res.redirect("/owners/register");
    }
  });
}

router.get("/admin", isOwnerLoggedIn, async (req, res) => {
  try {
    const products = await productModel.find();
    res.render("admin", {
      products,
      error: res.locals.error,
      success: res.locals.success,
      title: "All Products",
      loggedIn: false,
      ownerLoggedIn: true
    });
  } catch (err) {
    req.session.error = "Something went wrong while fetching products";
    res.redirect("/owners/account");
  }
});

router.get("/createProducts", isOwnerLoggedIn, (req, res) => {
  res.render("createproducts", {
    error: res.locals.error,
    success: res.locals.success,
    title: "Add Product",
    loggedIn: true
  });
});

router.get("/login", (req, res) => {
  res.render("owner-login", {
    error: res.locals.error,
    success: res.locals.success,
    hideHamburger: true, 
    title: "Owner Login",
    loggedIn: false
  });
});

router.post("/login", loginOwner);

router.get("/account", isOwnerLoggedIn, async (req, res) => {
  const owner = await ownerModel.findOne({ email: req.owner.email });
  res.render("owner-account", {
    owner,
    error: res.locals.error,
    success: res.locals.success,
    title: "Owner Account",
    loggedIn: false
  });
});

router.get("/logout", logout);

router.get("/products/edit/:id", isOwnerLoggedIn, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      req.session.error = "Product not found";
      return res.redirect("/owners/admin");
    }
    res.render("edit-product", {
      product,
      error: res.locals.error,
      success: res.locals.success,
      title: "Edit Product",
      loggedIn: false,
      ownerLoggedIn: true
    });
  } catch (err) {
    req.session.error = "Something went wrong";
    res.redirect("/owners/admin");
  }
});

router.post("/products/edit/:id", isOwnerLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

    const updateData = {
      name,
      price,
      discount,
      bgcolor,
      panelcolor,
      textcolor,
    };

    if (req.file) {
      updateData.image = req.file.buffer;
    }

    await productModel.findByIdAndUpdate(productId, updateData);
    req.session.success = "Product updated successfully!";
    res.redirect("/owners/admin");
  } catch (err) {
    console.log(err);
    req.session.error = "Something went wrong while updating";
    res.redirect("/owners/admin");
  }
});

router.get("/products/delete/:id", isOwnerLoggedIn, async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.id);
    req.session.success = "Product deleted successfully";
    res.redirect("/owners/admin");
  } catch (err) {
    req.session.error = "Failed to delete product";
    res.redirect("/owners/admin");
  }
});

module.exports = router;
