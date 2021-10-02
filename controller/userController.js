const User = require("../model/userModel");
const asyncHandler = require("./../utility/asyncHandler");
const AppError = require("./../utility/appError");

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const objectFiltered = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = asyncHandler(async (req, res, next) => {
  // Route is specified for  update all user info except password
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400,
        "fail"
      )
    );
  }

  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = objectFiltered(req.body, "name", "email");

  //  Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404, "fail"));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select("-password");

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      data: users,
    },
  });
});
