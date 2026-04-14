const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.post(
  "/",
  authenticate,
  authorize(["CONVENOR"]),
  groupController.createGroup
);

router.get(
  "/module/:moduleId",
  authenticate,
  authorize(["CONVENOR"]),
  groupController.getGroupsByModule
);

router.get(
  "/all",
  authenticate,
  authorize(["CONVENOR"]),
  groupController.getAllGroups
);

router.get(
  "/:id/students",
  authenticate,
  authorize(["CONVENOR"]),
  groupController.getGroupStudents
);

router.put(
  "/:id/students",
  authenticate,
  authorize(["CONVENOR"]),
  groupController.saveGroupStudents
);


router.put(
  "/:id",
  authenticate,
  authorize(["CONVENOR"]),
  groupController.updateGroup
);

router.delete(
  "/:id",
  authenticate,
  authorize(["CONVENOR"]),
  groupController.deleteGroup
);

module.exports = router;
