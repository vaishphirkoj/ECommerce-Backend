const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  // console.log();
  if (!token) {
    return next(new ErrorHandler("Please Login to access this resource", 401));
  }
  const decodeData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decodeData.id);
  next();
});

//CHECKING ROLE (ADMIN OR USER)
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role:{$req.user.role}is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
