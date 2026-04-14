const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");



// PUBLIC ROUTES
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOTP);

router.get(
  "/me",
  authenticate,
  authController.getCurrentUser
);


module.exports = router;
