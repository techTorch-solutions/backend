const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxlength: [50, "First name cannot be more than 50 characters"]
        },
        last_name: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxlength: [50, "Last name cannot be more than 50 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please add a valid email address"
            ]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"]
        },
        profile: {
            type: String,
            default:
                "https://tse4.mm.bing.net/th?id=OIP.eXWcaYbEtO2uuexHM8sAwwHaHa&pid=Api&P=0&h=180",
        },
        dob: {
            type: String,
            required: [true, "Date of birth is required"]
        },
        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            match: [
                /^[0-9]{10}$/,
                "Please add a valid mobile number"
            ]
        },
        is_verified: {
            type: Boolean,
            default: false
        },
    },
    { timestamps: true }
);

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) next();
    this.password = await bcrypt.hash(this.password, 11);
    next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getJWTToken = function () {
    return jwt.sign({ userId: this._id }, process.env.JWT_SECRET);
};

module.exports = mongoose.model("Users", UserSchema);
