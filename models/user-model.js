const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  orders: {
    type: Array,
    default: [],
  },
  contact: { type: Number },
  picture: { type: String },
});

const user = mongoose.model("user", userSchema);
module.exports = user;
