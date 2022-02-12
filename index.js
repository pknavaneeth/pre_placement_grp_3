const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const db = require("./config").get(process.env.NODE_ENV);
const cors = require("cors");
const morgan = require("morgan");
const router = require("./routes/routes.js");

// database connection
mongoose.Promise = global.Promise;
mongoose.connect(
  db.DATABASE,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err) {
    if (err) console.log(err);
    console.log("database is connected");
  }
);

const app = express();
// app use
app.use(morgan("combined"));
app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());
app.get("/", function (req, res) {
  res.status(200).send(`Welcome to login , sign-up api`);
});
app.use(router);

// listening port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`app is live at ${PORT}`);
});
