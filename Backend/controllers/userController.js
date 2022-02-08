const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//RESGISTRATION
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "this is sampel id",
      url: "profilepicUrl",
    },
  });

  const token = user.getJWTToken();

  
 

  
  sendToken(user, 201, res);
});

//LOGIN USER
exports.loginUSer = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  //CHECKING IF USER HAS GIVEN PASSWORD AND EMAIL BOTH
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email And Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  // const token = user.getJWTToken();

  // res.status(200).json({
  //   success: true,
  //   token,
  // });
  sendToken(user, 200, res);
});

//LOGOUT USER

exports.logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// FORGOT PASSWORD
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //GET RESETPASSWORD TOKEN{IT WILL SEND EMAIL TO USER WHO FORGOT PASSWORD}
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

//RESET PASSWORD{USING TOKEN}
// exports.resetPassword = catchAsyncError(async (req, res, next) => {
//   // creating token hash
//   const resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(req.params.token)
//     .digest("hex");

//   const user = await User.findOne({
//     resetPasswordToken,
//     resetPasswordExpire: { $gt: Date.now() },
//   });

//   if (!user) {
//     return next(
//       new ErrorHandler(
//         "Reset Password Token is invalid or has been expired",
//         400
//       )
//     );
//   }

//   if (req.body.password !== req.body.confirmPassword) {
//     return next(new ErrorHandler("Password does not password", 400));
//   }

//   user.password = req.body.password;
//   user.resetPasswordToken = undefined;
//   user.resetPasswordExpire = undefined;

//   await user.save();

//   sendToken(user, 200, res);
// });

// GET USER DETAIL
exports.getUserDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

//UPDATE USER PASSWORD
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return new new ErrorHandler("Old Password is Incorrect,400")();
  }
  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 200, res);
});

//UPDATE USER PROFILE
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });
});

//GET ALL USERS(ADMIN)
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

//GET SINGLE USER USING ID(ADMIN)
exports.getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 400)
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

//UPDATE USER ROLE(ADMIN)
exports.updateUserRole = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });
});

//DELETE USER(ADMIN)
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
 

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id:${req.params.id}`, 400)
    );
  }
  await user.remove();
  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});
