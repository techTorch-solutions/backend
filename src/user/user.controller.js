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

exports.verifyRegisterOTP = catchAsyncError(async (req, res, next) => {
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

exports.login = catchAsyncError(async (req, res, next) => {
    console.log("login", req.body);
    const { email, password } = req.body;

    const user = await userModel
        .findOne({ email }).select("+password")

    if (!user) {
        return next(
            new ErrorHandler(
                "User not found with entered credentials",
                StatusCodes.NOT_FOUND
            )
        );
    }

    if (!user.is_verified) {
        return next(
            new ErrorHandler("Please Verify OTP.", StatusCodes.UNAUTHORIZED)
        );
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return next(
            new ErrorHandler("Invalid Credentials", StatusCodes.BAD_REQUEST)
        );
    }

    const token = user.getJWTToken();

    res.status(StatusCodes.OK).json({ user, token });
});

exports.resendOTP = catchAsyncError(async (req, res, next) => {
    console.log("resendOTP", req.body);
    const { email } = req.body;
    if (!email) {
        return next(new ErrorHandler("Please enter your email.", 400));
    }

    const user = await userModel.findOne({ email });
    if (!user) {
        return next(
            new ErrorHandler("Please register or User doesn't exist.", 400)
        );
    }

    const otp = generateOTP();
    await storeOTP({ otp, user: user._id });

    try {
        const message = getMsg(otp);
        await sendMail({
            email: email,
            subject: "Resend OTP",
            message,
        });

        res.status(200).json({ message: "OTP sent to your email successfully" });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.verifyOtp = catchAsyncError(async (req, res, next) => {
    const { otp } = req.body;

    if (!otp) {
        return next(new ErrorHandler("Missing OTP", StatusCodes.BAD_REQUEST));
    }

    const otpInstance = await otpModel.findOne({ otp });

    if (!otpInstance) {
        await otpModel.destroy({ id: otpInstance.id });
        return next(
            new ErrorHandler(
                "Invalid OTP. Please check the entered OTP.",
                StatusCodes.BAD_REQUEST
            )
        );
    }

    // if (!otpInstance || otpInstance.isValid()) {
    //   if (otpInstance) {
    //     await otpModel.destroy({ where: { id: otpInstance.id } });
    //   }

    //   return next(
    //     new ErrorHandler(
    //       "OTP is invalid or has been expired",
    //       StatusCodes.BAD_REQUEST
    //     )
    //   );
    // }

    await otpModel.destroy({ id: otpInstance.id });

    res
        .status(StatusCodes.OK)
        .json({ message: "OTP verified successfully", userId: otpInstance.userId });
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
    console.log("User profile", req.userId);

    const { userId } = req;

    const user = await userModel.findById(userId);

    if (!user)
        return next(new ErrorHandler("User not found", StatusCodes.NOT_FOUND));

    res.status(StatusCodes.OK).json({ user });
});