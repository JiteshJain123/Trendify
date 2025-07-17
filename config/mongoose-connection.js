require("dotenv").config();
const mongoose = require("mongoose");

const dbgr = require("debug")("development:mongoose");

const mongoURI = process.env.MONGODB_URI 
  ? `${process.env.MONGODB_URI}/trendify`
  : "mongodb://127.0.0.1:27017/trendify";

mongoose.connect(mongoURI)
  .then(() => {
    console.log("✅ Connected to database");
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
  });

module.exports = mongoose.connection;
