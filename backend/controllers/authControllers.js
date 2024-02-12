import catchAsycError from "../middleware/catchAsycError.js";
import User from "../models/user.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendToken from "../utils/sendToken.js";
import sendEmail from "../utils/sendEmail.js";
import { getResetPasswordTemplate } from "../utils/emailtemplate.js";
import crypto from "crypto";

//Register user == {{Domain}}/api/v1/register
export const registerUser = catchAsycError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
  });

  sendToken(user, 201, res);
});

//login user == api/v1/login
export const LoginUser = catchAsycError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  // Find user in the database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Check if password is correct
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

// Logout user   =>  /api/v1/logout
export const logoutUser = catchAsycError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    message: "Logged Out",
  });
});

// To get the Forgot password route => /api/v1/forgot
export const forgotPassword = catchAsycError(async (req, res, next) => {
  // Find user in the database
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  // Get reset password token
  const resetToken = user.getResetPasswordToken();

  await user.save();

  // Create reset password url
  const resetUrl = `${process.env.FRONTEND_URL}/api/v1/password/reset/${resetToken}`;
  console.log(resetToken);

  const message = getResetPasswordTemplate(user?.name, resetUrl);

  try {
    await sendEmail({
      email: user.email,
      subject: "OwnIt Password Recovery",
      message,
    });

    res.status(200).json({
      message: `Email sent to: ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return next(new ErrorHandler(error?.message, 500));
  }
});

// Reset password   =>  /api/v1/password/reset/:token
export const resetPassword = catchAsycError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  console.log(resetPasswordToken);

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  console.log(user);

  if (!user) {
    return next(
      new ErrorHandler(
        "Password reset token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }
  user.password = req.body.password;
  console.log(user.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

//Log out the user => /api/v1/logout
export const logout = catchAsycError(async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ msg: "Logged out!" });
});

//Get the user profile data => /api/v1/me
export const getUserProfile = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req?.user?._id);
  res.status(200).json({
    user,
  });
});

//Update the user Password => /api/v1/password/update
export const updatePassword = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req?.user?._id).select("+password");

  const isPassword = await user.comparePassword(req.body.oldPassword);

  if (!isPassword) {
    return next(
      new ErrorHandler("Old Password dosent match ! Please Try again.", 400)
    );
  }

  if (req.body.oldPassword !== req.body.newPassword) {
    if (req.body.newPassword === req.body.confirmPassword) {
      user.password = req.body.confirmPassword;

      res.status(200).json({
        succcess: true,
      });
      user.save();
    }
    return next(
      new ErrorHandler(
        "The confirm password doesn't match the new password",
        400
      )
    );
  }
  return next(
    new ErrorHandler(
      "Your New Password Cannot be Same as old Password ! Please Try a new Password.",
      400
    )
  );
});

// Update User Profile  =>  /api/v1/me/update
export const updateProfile = catchAsycError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
    new: true,
  });

  res.status(200).json({
    user,
  });
});

// Get all Users - ADMIN  =>  /api/v1/admin/users
export const allUsers = catchAsycError(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    users,
  });
});

// Get User Details - ADMIN  =>  /api/v1/admin/users/:id
export const getUserDetails = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    user,
  });
});

// Update User Details - ADMIN  =>  /api/v1/admin/users/:id
export const updateUser = catchAsycError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
  });

  res.status(200).json({
    user,
  });
});

// Delete User - ADMIN  =>  /api/v1/admin/users/:id
export const deleteUser = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
    );
  }

  // TODO - Remove user avatar from cloudinary

  await user.deleteOne();

  res.status(200).json({
    success: true,
  });
});
