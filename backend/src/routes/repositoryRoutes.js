const express = require("express");
const router = express.Router();
const repositoryController = require("../controllers/repositoryController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.post(
  "/",
  authenticate,
  authorize(["CONVENOR"]),
  repositoryController.linkRepository
);

router.get(
  "/:groupId",
  authenticate,
  authorize(["CONVENOR"]),
  repositoryController.getRepositoryByGroup
);

router.get(
  "/overview/:groupId",
  authenticate,
  authorize(["CONVENOR"]),
  repositoryController.getRepositoryOverview
);

router.get(
  "/contributors/:groupId",
  authenticate,
  authorize(["CONVENOR"]),
  repositoryController.getRepositoryContributors
);

router.get(
  "/commits/:groupId",
  authenticate,
  authorize(["CONVENOR"]),
  repositoryController.getConsolidatedCommits
);

router.delete(
  "/:groupId",
  authenticate,
  authorize(["CONVENOR"]),
  repositoryController.deleteRepository
);

module.exports = router;
