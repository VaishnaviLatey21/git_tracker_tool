const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");



// PUBLIC ROUTES
router.post("/register", authController.register);
router.post("/admin/register", authController.adminRegister);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOTP);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get(
  "/me",
  authenticate,
  authController.getCurrentUser
);

router.put(
  "/change-password",
  authenticate,
  authController.changePassword
);


module.exports = router;
