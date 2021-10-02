const express = require("express");
const morgan = require("morgan");
const userRouter = require("./route/userRouter");

const AppError = require("./utility/appError");

const errorHandler = require("./controller/errorController");
// Start express app
const app = express();

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser, reading data from body into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3) ROUTES
app.use("/api/user", userRouter);

app.all("*", (req, res, next) => {
  console.log(req.or);
  next(new AppError("Invalid URL", 404, "fail"));
});

app.use(errorHandler);
module.exports = app;
