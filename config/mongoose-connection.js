const mongoose = require("mongoose");
const dbgr = require("debug")("development:mongoose");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    dbgr("Connected to database");
  })
  .catch((err) => {
    dbgr(err);
  });

module.exports = mongoose.connection;
