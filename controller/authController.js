const User = require("../model/userModel");
const asyncHandler = require("./../utility/asyncHandler");
const jwt = require("jsonwebtoken");
const AppError = require("../utility/appError");
const { promisify } = require("util");

//Signup Controller

exports.signup = asyncHandler(async (req, res, next) => {
  // create new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //Send Token

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

//Login Controller

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Check if user provided email and password
  if (!email || !password) {
    return next(new AppError("Provide email and password", 400, "fail"));
  }

  //Check is user exist??
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Please provide valid credential", 400, "fail"));
  }
  //Check is password match
  const isMatched = await user.confirmPassword(password, user.password);
  if (!isMatched) {
    return next(new AppError("Please provide valid credential", 401, "fail"));
  }

  //Send Token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  res.status(200).json({
    status: "success",
    token,
  });
});

//Authentication Controller

exports.authentication = asyncHandler(async (req, res, next) => {
  // Get the token from request header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // check if token exist

  if (!token) {
    return next(new AppError("You are not logged in!", 401, "fail"));
  }

  // 2) Verify token
  const decodedInfo = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) Check if user  exists

  const user = await User.findById(decodedInfo.id);
  if (!user) {
    return next(new AppError("Invalid Token.", 401, "fail"));
  }

  // 4) Check if user changed password after the token was issued
  if (user.changedPasswordAfter(decodedInfo.iat)) {
    return next(new AppError("Please log in again.", 401, "fail"));
  }

  // Grant access to protected route
  req.user = user;
  next();
});

//Authrization Controller

exports.authorization = (role) => {
  return (req, res, next) => {
    // check if user role matched with authorized role

    if (role !== req.user.role) {
      return next(new AppError("permission denied", 403, "fail"));
    }
    next();
  };
};

//Update Password Controller

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  //compare given password with the current password
  const isMatched = await user.confirmPassword(
    req.body.passwordCurrent,
    user.password
  );

  if (!isMatched) {
    return next(new AppError("Your password is wrong", 401, "fail"));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //Send Token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  res.status(200).json({
    status: "success",
    token,
  });
});
