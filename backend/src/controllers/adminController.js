const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ALLOWED_ROLES = ["ADMIN", "CONVENOR", "STUDENT"];

const toDateKey = (value) => new Date(value).toISOString().split("T")[0];

const buildLastNDaysSeries = (rows, dateAccessor, days, valueKey = "count") => {
  const map = {};
  rows.forEach((row) => {
    const key = toDateKey(dateAccessor(row));
    map[key] = (map[key] || 0) + 1;
  });

  const output = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const cursor = new Date(today);
    cursor.setDate(today.getDate() - i);
    const key = toDateKey(cursor);
    output.push({
      date: key,
      [valueKey]: map[key] || 0,
    });
  }

  return output;
};

exports.getSystemSummary = async (_req, res) => {
  try {
    const [totalUsers, verifiedUsers, totalModules, totalGroups, totalRepos, totalCommits] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.module.count(),
        prisma.group.count(),
        prisma.repository.count(),
        prisma.commit.count(),
      ]);

    const usersByRoleRows = await prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });

    const usersByRole = usersByRoleRows.reduce((acc, row) => {
      acc[row.role] = row._count._all;
      return acc;
    }, {});

    const flaggedContributors = await prisma.commit.groupBy({
      by: ["authorEmail"],
      where: {
        OR: [
          { qualityScore: { lt: 60 } },
          { isSmallCommit: true },
          { isWhitespaceOnly: true },
        ],
      },
      _count: { _all: true },
    });

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
    twoWeeksAgo.setHours(0, 0, 0, 0);

    const recentCommits = await prisma.commit.findMany({
      where: { timestamp: { gte: twoWeeksAgo } },
      select: { timestamp: true },
      orderBy: { timestamp: "asc" },
    });

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      totals: {
        users: totalUsers,
        verifiedUsers,
        modules: totalModules,
        groups: totalGroups,
        repositories: totalRepos,
        commits: totalCommits,
        flaggedContributors: flaggedContributors.length,
      },
      usersByRole: {
        ADMIN: usersByRole.ADMIN || 0,
        CONVENOR: usersByRole.CONVENOR || 0,
        STUDENT: usersByRole.STUDENT || 0,
      },
      trends: {
        commitActivity: buildLastNDaysSeries(
          recentCommits,
          (item) => item.timestamp,
          14,
          "commits"
        ),
        userSignups: buildLastNDaysSeries(
          recentUsers,
          (item) => item.createdAt,
          14,
          "users"
        ),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            modules: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { role } = req.body;

    if (!userId || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid user or role" });
    }

    if (req.user.id === userId && role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "You cannot demote your own admin account" });
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existing.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin account must remain" });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (req.user.id === userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existing.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin account must remain" });
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
