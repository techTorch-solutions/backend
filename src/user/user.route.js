const express = require('express')
const router = express.Router()
const upload = require("../../utils/imageUpload");
const { auth } = require("../../middleware/auth")
const {
    register,
    login,
    resendOTP,
    verifyRegisterOTP,
    verifyOtp,
    getProfile
} = require("./user.controller")

router.post("/register", register)
router.post("/verifyRegisterOTP", verifyRegisterOTP)
router.post("/login", login)
router.post("/resendOTP", resendOTP)
router.post("/verifyOTP", verifyOtp)
router.get("/profile", auth, getProfile)

module.exports = router