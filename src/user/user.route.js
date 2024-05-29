const express = require('express')
const router = express.Router()
const upload = require("../../utils/imageUpload");

const {
    register,
    verifyOTP
} = require("./user.controller")

router.post("/register", register)
router.post("/verifyOTP", verifyOTP)

module.exports = router