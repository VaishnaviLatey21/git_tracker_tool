const express = require("express");
const router = express.Router();
const moduleController = require("../controllers/moduleController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Only CONVENOR can manage modules

router.post(
  "/",
  authenticate,
  authorize(["CONVENOR"]),
  moduleController.createModule
);


router.get(
  "/",
  authenticate,
  authorize(["CONVENOR"]),
  moduleController.getModules
);

router.get(
  "/all",
  authenticate,
  authorize(["CONVENOR"]),
  moduleController.getAllModules
);

router.get(
  "/overview",
  authenticate,
  authorize(["CONVENOR"]),
  moduleController.getOverview
);

router.put(
  "/:id",
  authenticate,
  authorize(["CONVENOR"]),
  moduleController.updateModule
);

router.delete(
  "/:id",
  authenticate,
  authorize(["CONVENOR"]),
  moduleController.deleteModule
);

module.exports = router;
