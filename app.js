const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const db = require("./config/mongoose-connection");
const expressSession = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const ownersRouter = require("./routes/ownersRouter");
const usersRouter = require("./routes/usersRouter");
const productsRouter = require("./routes/productsRouter");
const indexRouter = require("./routes/index");
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch", 
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60 // 14 din tak session valid
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // https pe true, local pe false
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 din tak cookie valid
    }
  })
);

app.use((req, res, next) => {
  res.locals.ownerToken = req.cookies.ownerToken;
  next();
});

app.use(flash());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/owners", ownersRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);

app.listen(3000);
