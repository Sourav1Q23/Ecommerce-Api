const express = require("express");
const authController = require("./../controller/authController");
const userController = require("./../controller/userController");

const router = express.Router();

router.post("/signup", authController.signup); //tested
router.post("/login", authController.login); //tested

router.use(authController.authentication);

router.patch("/updatePassword", authController.updatePassword); //
router.get("/me", userController.getMe, userController.getUser); // tested
router.patch("/updateMe", userController.updateMe);

router.use(authController.authorization("admin"));

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);

module.exports = router;
