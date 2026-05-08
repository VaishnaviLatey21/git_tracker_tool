const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ensureSupportModels = () => {
  if (!prisma.supportThread || !prisma.supportMessage) {
    throw new Error(
      "Support messaging is not initialized. Run `npm run prisma:generate` and restart backend server."
    );
  }
};

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const cleanText = (value) => String(value || "").trim();

const toThreadSummary = (thread, unreadFor = "convenor") => {
  const latestMessage = Array.isArray(thread.messages) ? thread.messages[0] : null;
  const unreadCount = (thread.messages || []).filter((message) =>
    unreadFor === "admin"
      ? !message.isReadByAdmin && message.senderRole === "CONVENOR"
      : !message.isReadByConvenor && message.senderRole === "ADMIN"
  ).length;

  return {
    id: thread.id,
    subject: thread.subject,
    status: thread.status,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    lastMessageAt: thread.lastMessageAt,
    unreadCount,
    convenor: thread.convenor
      ? {
          id: thread.convenor.id,
          name: thread.convenor.name,
          email: thread.convenor.email,
        }
      : null,
    latestMessage: latestMessage
      ? {
          id: latestMessage.id,
          senderRole: latestMessage.senderRole,
          message: latestMessage.message,
          createdAt: latestMessage.createdAt,
          senderName: latestMessage.sender?.name || null,
        }
      : null,
  };
};

const getConvenorThread = (threadId, convenorId) =>
  (ensureSupportModels(),
  prisma.supportThread.findFirst({
    where: {
      id: threadId,
      convenorId,
    },
    include: {
      convenor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  }));

const getAdminThread = (threadId) =>
  (ensureSupportModels(),
  prisma.supportThread.findUnique({
    where: { id: threadId },
    include: {
      convenor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  }));

exports.createConvenorQuestion = async (req, res) => {
  try {
    ensureSupportModels();
    const subject = cleanText(req.body?.subject) || "General Question";
    const message = cleanText(req.body?.message);

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const thread = await prisma.supportThread.create({
      data: {
        convenorId: req.user.id,
        subject,
        status: "OPEN",
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: req.user.id,
            senderRole: "CONVENOR",
            message,
            isReadByConvenor: true,
            isReadByAdmin: false,
          },
        },
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return res.status(201).json({
      message: "Question submitted to admin",
      threadId: thread.id,
      thread: toThreadSummary(thread),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.listConvenorThreads = async (req, res) => {
  try {
    ensureSupportModels();
    const threads = await prisma.supportThread.findMany({
      where: { convenorId: req.user.id },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return res.json(threads.map((thread) => toThreadSummary(thread)));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getConvenorThreadMessages = async (req, res) => {
  try {
    ensureSupportModels();
    const threadId = parseId(req.params.threadId);
    if (!threadId) {
      return res.status(400).json({ message: "Invalid thread id" });
    }

    const thread = await getConvenorThread(threadId, req.user.id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    await prisma.supportMessage.updateMany({
      where: {
        threadId,
        senderRole: "ADMIN",
        isReadByConvenor: false,
      },
      data: {
        isReadByConvenor: true,
      },
    });

    return res.json({
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messages: thread.messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderRole: message.senderRole,
        senderName: message.sender?.name || "Unknown",
        senderEmail: message.sender?.email || "",
        message: message.message,
        createdAt: message.createdAt,
        isReadByConvenor: message.isReadByConvenor,
        isReadByAdmin: message.isReadByAdmin,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.replyAsConvenor = async (req, res) => {
  try {
    ensureSupportModels();
    const threadId = parseId(req.params.threadId);
    const messageText = cleanText(req.body?.message);

    if (!threadId) {
      return res.status(400).json({ message: "Invalid thread id" });
    }

    if (!messageText) {
      return res.status(400).json({ message: "Message is required" });
    }

    const thread = await prisma.supportThread.findFirst({
      where: {
        id: threadId,
        convenorId: req.user.id,
      },
      select: { id: true },
    });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const created = await prisma.supportMessage.create({
      data: {
        threadId,
        senderId: req.user.id,
        senderRole: "CONVENOR",
        message: messageText,
        isReadByConvenor: true,
        isReadByAdmin: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await prisma.supportThread.update({
      where: { id: threadId },
      data: {
        status: "OPEN",
        lastMessageAt: new Date(),
      },
    });

    return res.status(201).json({
      id: created.id,
      senderRole: created.senderRole,
      senderName: created.sender?.name || "Unknown",
      message: created.message,
      createdAt: created.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getConvenorNotifications = async (req, res) => {
  try {
    ensureSupportModels();
    const unreadItems = await prisma.supportMessage.findMany({
      where: {
        senderRole: "ADMIN",
        isReadByConvenor: false,
        thread: {
          convenorId: req.user.id,
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            subject: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return res.json({
      unreadCount: unreadItems.length,
      notifications: unreadItems.map((item) => ({
        id: item.id,
        threadId: item.threadId,
        threadSubject: item.thread?.subject || "Question",
        status: item.thread?.status || "OPEN",
        message: item.message,
        senderName: item.sender?.name || "Admin",
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.markConvenorNotificationsRead = async (req, res) => {
  try {
    ensureSupportModels();
    const updated = await prisma.supportMessage.updateMany({
      where: {
        senderRole: "ADMIN",
        isReadByConvenor: false,
        thread: {
          convenorId: req.user.id,
        },
      },
      data: {
        isReadByConvenor: true,
      },
    });

    return res.json({
      message: "Notifications marked as read",
      updated: updated.count,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.listAdminThreads = async (req, res) => {
  try {
    ensureSupportModels();
    const statusFilter = cleanText(req.query?.status).toUpperCase();
    const where =
      statusFilter && ["OPEN", "RESOLVED"].includes(statusFilter)
        ? { status: statusFilter }
        : {};

    const threads = await prisma.supportThread.findMany({
      where,
      include: {
        convenor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return res.json(threads.map((thread) => toThreadSummary(thread, "admin")));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAdminThreadMessages = async (req, res) => {
  try {
    ensureSupportModels();
    const threadId = parseId(req.params.threadId);
    if (!threadId) {
      return res.status(400).json({ message: "Invalid thread id" });
    }

    const thread = await getAdminThread(threadId);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    await prisma.supportMessage.updateMany({
      where: {
        threadId,
        senderRole: "CONVENOR",
        isReadByAdmin: false,
      },
      data: {
        isReadByAdmin: true,
      },
    });

    return res.json({
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      convenor: thread.convenor,
      messages: thread.messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderRole: message.senderRole,
        senderName: message.sender?.name || "Unknown",
        senderEmail: message.sender?.email || "",
        message: message.message,
        createdAt: message.createdAt,
        isReadByConvenor: message.isReadByConvenor,
        isReadByAdmin: message.isReadByAdmin,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.replyAsAdmin = async (req, res) => {
  try {
    ensureSupportModels();
    const threadId = parseId(req.params.threadId);
    const messageText = cleanText(req.body?.message);
    const markResolved = Boolean(req.body?.markResolved);

    if (!threadId) {
      return res.status(400).json({ message: "Invalid thread id" });
    }

    if (!messageText) {
      return res.status(400).json({ message: "Message is required" });
    }

    const thread = await prisma.supportThread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const created = await prisma.supportMessage.create({
      data: {
        threadId,
        senderId: req.user.id,
        senderRole: "ADMIN",
        message: messageText,
        isReadByAdmin: true,
        isReadByConvenor: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await prisma.supportThread.update({
      where: { id: threadId },
      data: {
        status: markResolved ? "RESOLVED" : "OPEN",
        lastMessageAt: new Date(),
      },
    });

    return res.status(201).json({
      id: created.id,
      senderRole: created.senderRole,
      senderName: created.sender?.name || "Admin",
      message: created.message,
      createdAt: created.createdAt,
      status: markResolved ? "RESOLVED" : "OPEN",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAdminNotifications = async (_req, res) => {
  try {
    ensureSupportModels();
    const unreadItems = await prisma.supportMessage.findMany({
      where: {
        senderRole: "CONVENOR",
        isReadByAdmin: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        thread: {
          include: {
            convenor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return res.json({
      unreadCount: unreadItems.length,
      notifications: unreadItems.map((item) => ({
        id: item.id,
        threadId: item.threadId,
        threadSubject: item.thread?.subject || "Convenor Message",
        status: item.thread?.status || "OPEN",
        message: item.message,
        senderName: item.sender?.name || "Convenor",
        convenorName: item.thread?.convenor?.name || "Convenor",
        convenorEmail: item.thread?.convenor?.email || "",
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.markAdminNotificationsRead = async (_req, res) => {
  try {
    ensureSupportModels();
    const updated = await prisma.supportMessage.updateMany({
      where: {
        senderRole: "CONVENOR",
        isReadByAdmin: false,
      },
      data: {
        isReadByAdmin: true,
      },
    });

    return res.json({
      message: "Notifications marked as read",
      updated: updated.count,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
