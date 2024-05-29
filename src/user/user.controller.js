const ErrorHandler = require("../../utils/errorhandler");
const { UserSchema, } = require("./user.model");
const otpModel = require("../otp/otp.model")
const catchAsyncError = require("../../utils/catchAsyncError");
const sendMail = require("../../utils/sendMail");
const generateOTP = require("../../utils/otpGenerator");
const { StatusCodes } = require("http-status-codes");
const userModel = require("./user.model");
const upload = require("../../utils/imageUpload");


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

exports.register = catchAsyncError(async (req, res, next) => {
    console.log("inside updateAndSendOTP", req.body);

    const { first_name, last_name, dob, email, password, mobile } = req.body;

    let user = await userModel.findOne({ email });

    if (user) {
        if (user.is_verified) {
            return next(new ErrorHandler("User already exists with this email", StatusCodes.BAD_REQUEST));
        } else {
            // Update user details if they are not verified
            user.first_name = first_name || user.first_name;
            user.last_name = last_name || user.last_name;
            user.dob = dob || user.dob;
            user.password = password || user.password; // Ensure password is hashed
            user.mobile = mobile || user.mobile;

            await user.save();
        }
    } else {
        // Create new user if not exists
        user = await userModel.create({
            first_name,
            last_name,
            dob,
            email,
            password,
            mobile,
        });
    }

    console.log(user)
    const otp = generateOTP();
    await storeOTP({ otp, user: user._id });

    try {
        const message = getMsg(otp);
        await sendMail({
            email: user.email,
            subject: "Verify Registration OTP",
            message,
        });
        res.status(StatusCodes.CREATED).json({ message: `OTP sent to ${user.email} successfully` });
    } catch (error) {
        return next(new ErrorHandler(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
    }
})

exports.verifyOTP = catchAsyncError(async (req, res, next) => {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("User not found", StatusCodes.NOT_FOUND));
    }

    const otpRecord = await otpModel.findOne({ otp, user: user._id });

    if (!otpRecord) {
        return next(new ErrorHandler("Invalid OTP", StatusCodes.BAD_REQUEST));
    }

    // Mark user as verified
    user.is_verified = true;
    await user.save();

    // Remove OTP record
    await otpModel.deleteOne({ _id: otpRecord._id });

    const token = user.getJWTToken()

    const userResponse = {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_url: user.profile_url,
        dob: user.dob,
        mobile: user.mobile,
        is_verified: user.is_verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

    res.status(StatusCodes.OK).json({ success: true, user: userResponse, token });
});