const express = require('express')
const router = express.Router()
const { getAllUsers, createAdmin, getSingleUser, deleteUser, editUser } = require("./admin.controller")
const { authRole, auth } = require("../../middleware/auth")

router.get("/getAllUsers", auth, authRole(["Admin"]), getAllUsers)
router.post("/createAdmin", createAdmin)
router.route
    ("/user/:id")
    .get(auth, authRole(["Admin"]), getSingleUser)
    .delete(auth, authRole(["Admin"]), deleteUser)
    .put(auth, authRole(["Admin"]), editUser)

module.exports = router