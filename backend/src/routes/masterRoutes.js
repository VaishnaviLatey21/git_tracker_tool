const express = require("express");
const router = express.Router();
const { MODULE_LIST } = require("../constants/masterData");
const masterController = require("../controllers/masterController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");



router.get(
  "/modules",
  authenticate,
  authorize(["CONVENOR"]),
  masterController.getMasterModules
);

module.exports = router;
