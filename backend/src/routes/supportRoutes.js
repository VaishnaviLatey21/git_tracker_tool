const express = require("express");
const router = express.Router();
const supportController = require("../controllers/supportController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.post(
  "/convenor/questions",
  authenticate,
  authorize(["CONVENOR"]),
  supportController.createConvenorQuestion
);

router.get(
  "/convenor/threads",
  authenticate,
  authorize(["CONVENOR"]),
  supportController.listConvenorThreads
);

router.get(
  "/convenor/threads/:threadId/messages",
  authenticate,
  authorize(["CONVENOR"]),
  supportController.getConvenorThreadMessages
);

router.post(
  "/convenor/threads/:threadId/messages",
  authenticate,
  authorize(["CONVENOR"]),
  supportController.replyAsConvenor
);

router.get(
  "/convenor/notifications",
  authenticate,
  authorize(["CONVENOR"]),
  supportController.getConvenorNotifications
);

router.post(
  "/convenor/notifications/read",
  authenticate,
  authorize(["CONVENOR"]),
  supportController.markConvenorNotificationsRead
);

router.get(
  "/admin/threads",
  authenticate,
  authorize(["ADMIN"]),
  supportController.listAdminThreads
);

router.get(
  "/admin/threads/:threadId/messages",
  authenticate,
  authorize(["ADMIN"]),
  supportController.getAdminThreadMessages
);

router.post(
  "/admin/threads/:threadId/reply",
  authenticate,
  authorize(["ADMIN"]),
  supportController.replyAsAdmin
);

router.get(
  "/admin/notifications",
  authenticate,
  authorize(["ADMIN"]),
  supportController.getAdminNotifications
);

router.post(
  "/admin/notifications/read",
  authenticate,
  authorize(["ADMIN"]),
  supportController.markAdminNotificationsRead
);

module.exports = router;
