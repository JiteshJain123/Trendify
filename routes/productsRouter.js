const express = require("express");
const router = express.Router();
const fs = require("fs");
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    let { name, price, discount, bgcolor, panelcolor, textcolor, category } = req.body;

    const allowedCategories = ["bags", "shoes", "pants", "t-shirts", "accessories"];
    let finalCategory = category.toLowerCase();

    const lowerName = name.toLowerCase();
    if (lowerName.includes("belt") || lowerName.includes("wallet") || lowerName.includes("watch")) {
      finalCategory = "accessories";
    }

    if (!allowedCategories.includes(finalCategory)) {
      req.session.error = "Invalid category selected!";
      return res.redirect("/owners/admin");
    }

    let imageData;
    if (req.file && req.file.buffer) {
      imageData = req.file.buffer;
    } else {
      imageData = fs.readFileSync(req.file.path);
    }

    const newProduct = new productModel({
      name,
      price,
      discount,
      bgcolor,
      panelcolor,
      textcolor,
      category: finalCategory,
      image: imageData,
    });

    await newProduct.save();

    req.session.success = "Product created successfully!";
    res.redirect("/owners/admin");
  } catch (err) {
    console.log(err);
    req.session.error = "Error creating product";
    res.redirect("/owners/admin");
  }
});

module.exports = router;
