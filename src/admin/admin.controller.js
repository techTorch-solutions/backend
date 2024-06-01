const ErrorHandler = require("../../utils/errorhandler");
const otpModel = require("../otp/otp.model")
const catchAsyncError = require("../../utils/catchAsyncError");
const sendMail = require("../../utils/sendMail");
const generateOTP = require("../../utils/otpGenerator");
const { StatusCodes } = require("http-status-codes");
const userModel = require("../user/user.model");
const upload = require("../../utils/imageUpload");
const paginate = require("../../utils/pagination")

const getMsg = (otp) => {
    return `<html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        /* Add your CSS styles here */
        body {
          font-family: Arial, sans-serif;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        h1 {
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to techTorch</h1>
        <p>your verification otp is</p><b>${otp}</b>
      </div>
    </body>
    </html>`;
};

const storeOTP = async ({ otp, user }) => {
    console.log({ otp, user });

    const otpInstance = await otpModel.findOne({ user })
    if (!otpInstance) {
        await otpModel.create({
            user,
            otp,
        });
    } else {
        otpInstance.otp = otp;
        await otpInstance.save();
    }
};

exports.createAdmin = catchAsyncError(async (req, res, next) => {

    const user = await userModel.create({ ...req.body, is_verified: true });

    res.status(StatusCodes.CREATED).json({ success: true, user });
});

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
    const { page, limit } = req.query;
    const query = {
        is_verified: true,
        role: { $ne: "Admin" }
    };
    const users = await paginate(userModel, page, limit, query);

    res.status(StatusCodes.OK).json(users);
});

exports.getSingleUser = catchAsyncError(async (req, res, next) => {
    const user = await userModel.findById(req.params.id)

    if (!user)
        return next(new ErrorHandler("User Not Fount", StatusCodes.NOT_FOUND));

    res.status(StatusCodes.OK).json({ success: true, user })
})

exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await userModel.findById(req.params.id)

    if (!user) {
        return next(new ErrorHandler("User Not Fount", StatusCodes.NOT_FOUND));
    }

    const deleted = await userModel.deleteOne({ _id: user._id })

    if (!deleted) {
        return next(new ErrorHandler("Some Error Occured", StatusCodes.INTERNAL_SERVER_ERROR));
    }

    res.status(StatusCodes.OK).json({ success: true, message: "Deleted Successfully" })
})

exports.editUser = catchAsyncError(async (req, res, next) => {
    const user = await userModel.findById(req.params.id)
    const { first_name, last_name, mobile } = req.body
    if (!user) {
        return next(new ErrorHandler("User Not Fount", StatusCodes.NOT_FOUND));
    }

    let updateFields = {}

    if (first_name) updateFields.first_name = first_name
    if (last_name) updateFields.last_name = last_name
    if (mobile) updateFields.mobile = mobile

    const updated = await user.updateOne(updateFields)

    if (!updated) {
        return next(new ErrorHandler("Some Error Occured", StatusCodes.INTERNAL_SERVER_ERROR));
    }

    res.status(StatusCodes.OK).json({ success: true, message: "Updated Successfully" })
})