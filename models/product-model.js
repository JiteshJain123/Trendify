const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  image: Buffer,
  name: String,
  price: Number,
  discount: {
    type: Number,
    default: 0,
  },
  bgcolor: String,
  panelcolor: String,
  textcolor: String,
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
});

const product = mongoose.model("product", productSchema);
module.exports = product;
