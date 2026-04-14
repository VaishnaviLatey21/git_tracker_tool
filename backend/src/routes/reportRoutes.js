const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get(
  "/group/:groupId",
  authenticate,
  authorize(["CONVENOR"]),
  reportController.generateGroupReport
);

router.get(
  "/group/:groupId/csv",
  authenticate,
  authorize(["CONVENOR"]),
  reportController.exportGroupReportCSV
);

router.get(
  "/group/:groupId/pdf",
  authenticate,
  authorize(["CONVENOR"]),
  reportController.exportGroupReportPDF
);

module.exports = router;