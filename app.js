const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const path = require("path");

const { setRoutes } = require("./config/routes");
const errorMiddleware = require("./middleware/error");

const app = express();

const corsOptions = {
  origin: process.env.CORS_URL?.split(","),
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("views", path.join(__dirname, "./views"));

app.set("view engine", "ejs");
setRoutes(app);
app.use(errorMiddleware);

module.exports = app;