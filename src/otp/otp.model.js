const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
        },
        otp: {
            type: Number,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("OTP", OtpSchema);
