require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const db = require("./config/mongoose-connection");
const expressSession = require("express-session");
const MongoStore = require("connect-mongo");

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Session setup
app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch",
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ✅ Manual flash message handler
app.use((req, res, next) => {
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

// ✅ Owner token check
app.use((req, res, next) => {
  res.locals.ownerToken = req.cookies.ownerToken || null;
  next();
});

// ✅ Static & view setup
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// ✅ Routes
app.use("/", require("./routes/index"));
app.use("/owners", require("./routes/ownersRouter"));
app.use("/users", require("./routes/usersRouter"));
app.use("/products", require("./routes/productsRouter"));

// ✅ Server
app.listen(3000); 