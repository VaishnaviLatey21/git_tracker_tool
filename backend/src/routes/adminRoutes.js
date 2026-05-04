const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get(
  "/summary",
  authenticate,
  authorize(["ADMIN"]),
  adminController.getSystemSummary
);

router.get(
  "/users",
  authenticate,
  authorize(["ADMIN"]),
  adminController.getUsers
);

router.put(
  "/users/:userId/role",
  authenticate,
  authorize(["ADMIN"]),
  adminController.updateUserRole
);

router.delete(
  "/users/:userId",
  authenticate,
  authorize(["ADMIN"]),
  adminController.deleteUser
);

module.exports = router;
