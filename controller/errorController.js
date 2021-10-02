const AppError = require("../utility/appError");

const handleDuplicateFieldError = (err) => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/);
  const message = `Duplicate field value. Please use different value`;
  return new AppError(message, 400);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}:${err.value}, Please provide correct info`;
  return new AppError(message, 400, "fail");
};
const handleJsonWebTokenError = (err) => {
  const message = `Invalid token. please log in again`;
  return new AppError(message, 400, "fail");
};
const handleTokenExpiredError = (err) => {
  const message = `your token has expired. please log in again`;
  return new AppError(message, 400, "fail");
};
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation Error: ${errors.join(".")}`;

  return new AppError(message, 400, "fail");
};

const sendDevelopmentError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
const sendProductionError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log("ERROR:", err);

    res.status(500).json({
      status: "fail",
      message: "Something Went Wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendDevelopmentError(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if ((error.name = "CastError")) {
      error = handleCastError(error);
    }
    if (error.name === "MongoError" && error.code === 11000) {
      error = handleDuplicateFieldError(error);
    }
    if (error.name === "ValidationError") {
      error = handleValidationError(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = handleJsonWebTokenError(error);
    }
    if (error.name === "TokenExpiredError") {
      error = handleTokenExpiredError(error);
    }

    sendProductionError(error, res);
  }
};
