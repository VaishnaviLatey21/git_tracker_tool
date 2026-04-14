const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


// CREATE MODULE
exports.createModule = async (req, res) => {
    try {
        const { name, year, minExpectedCommits, inactivityDays, smallCommitThreshold } = req.body;

        // Check for duplicate module name for same convenor
        const existingModule = await prisma.module.findFirst({
            where: {
                name,
                convenorId: req.user.id,
            },
        });

        if (existingModule) {
            return res.status(400).json({
                message: "Module with this name already exists",
            });
        }

        const module = await prisma.module.create({
            data: {
                name,
                year,
                convenorId: req.user.id,

                minExpectedCommits: Math.max(0, Number(minExpectedCommits) || 0),
                inactivityDays: Math.max(0, Number(inactivityDays) || 0),
                smallCommitThreshold: Math.max(0, Number(smallCommitThreshold) || 0),
            },
        });

        res.status(201).json(module);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// GET ALL MODULES (Only for logged-in convenor)
exports.getModules = async (req, res) => {
    console.log("Logged in user:", req.user.id);
    try {
        const modules = await prisma.module.findMany({
            where: {
                convenorId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log("Modules returned:", modules);

        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// UPDATE MODULE
exports.updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, year } = req.body;

        // Ensure module belongs to convenor
        const existing = await prisma.module.findFirst({
            where: {
                id: parseInt(id),
                convenorId: req.user.id,
            },
        });

        if (!existing)
            return res.status(403).json({ message: "Unauthorized" });

        const updated = await prisma.module.update({
            where: { id: parseInt(id) },
            data: { name, year },
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE MODULE
exports.deleteModule = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        const existing = await prisma.module.findFirst({
            where: {
                id: parsedId,
                convenorId: req.user.id,
            },
        });

        if (!existing)
            return res.status(403).json({ message: "Unauthorized" });

        const groups = await prisma.group.findMany({
            where: { moduleId: parsedId },
            select: {
                id: true,
                repo: {
                    select: { id: true },
                },
                students: {
                    select: { id: true },
                },
            },
        });

        const groupIds = groups.map((group) => group.id);
        const repositoryIds = groups
            .map((group) => group.repo?.id)
            .filter(Boolean);
        const studentIds = groups.flatMap((group) =>
            group.students.map((student) => student.id)
        );

        await prisma.$transaction(async (tx) => {
            if (repositoryIds.length > 0) {
                await tx.commit.deleteMany({
                    where: {
                        repositoryId: {
                            in: repositoryIds,
                        },
                    },
                });
            }

            if (studentIds.length > 0) {
                await tx.identityMapping.deleteMany({
                    where: {
                        studentId: {
                            in: studentIds,
                        },
                    },
                });
            }

            if (groupIds.length > 0) {
                await tx.student.deleteMany({
                    where: {
                        groupId: {
                            in: groupIds,
                        },
                    },
                });

                await tx.repository.deleteMany({
                    where: {
                        groupId: {
                            in: groupIds,
                        },
                    },
                });

                await tx.group.deleteMany({
                    where: {
                        id: {
                            in: groupIds,
                        },
                    },
                });
            }

            await tx.module.delete({
                where: { id: parsedId },
            });
        });

        res.json({ message: "Module deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET ALL MODULES
exports.getAllModules = async (req, res) => {
    try {
        const modules = await prisma.module.findMany({
            include: {
                convenor: true,
            },
        });

        res.json(modules);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


exports.getOverview = async (req, res) => {
    try {
        const convenorId = req.user.id;

        // 1 Total Modules (ONLY this convenor)
        const totalModules = await prisma.module.count({
            where: {
                convenorId
            },
        });

        // 2 Total Groups (ONLY modules of this convenor)
        const totalGroups = await prisma.group.count({
            where: {
                module: {
                    convenorId,
                },
            },
        });

        // 3 Total Repositories (ONLY this convenor’s groups)
        const repositories = await prisma.repository.count({
            where: {
                group: {
                    module: {
                        convenorId,
                    },
                },
            },
        });

        // 4 Fetch commits only for this convenor
        const commits = await prisma.commit.findMany({
            where: {
                repository: {
                    group: {
                        module: {
                            convenorId,
                        },
                    },
                },
            },
            orderBy: { timestamp: "desc" },
        });

        console.log("Total commits in DB for this convenor:", commits.length);

        // 5 Compute flagged students
        const studentMap = {};

        commits.forEach((commit) => {
            const email = commit.authorEmail;

            if (!studentMap[email]) {
                studentMap[email] = {
                    lowQuality: 0,
                    small: 0,
                    whitespace: 0,
                };
            }

            if (commit.qualityScore < 60) {
                studentMap[email].lowQuality++;
            }

            if (commit.isSmallCommit) {
                studentMap[email].small++;
            }

            if (commit.isWhitespaceOnly) {
                studentMap[email].whitespace++;
            }
        });

        let flaggedStudents = 0;

        Object.values(studentMap).forEach((student) => {
            if (
                student.lowQuality > 0 ||
                student.small > 0 ||
                student.whitespace > 0
            ) {
                flaggedStudents++;
            }
        });

        // 6 Activity trend (last 7 days)
        const activityMap = {};

        commits.forEach((commit) => {
            const date = commit.timestamp.toISOString().split("T")[0];
            activityMap[date] = (activityMap[date] || 0) + 1;
        });

        const activityTrend = Object.keys(activityMap)
            .sort()
            .slice(-7)
            .map((date) => ({
                date,
                commits: activityMap[date],
            }));

        // 7 Risk distribution
        const totalStudents = Object.keys(studentMap).length;

        const riskDistribution = [
            { category: "Flagged", count: flaggedStudents },
            { category: "Healthy", count: totalStudents - flaggedStudents },
        ];

        res.json({
            totalModules,
            totalGroups,
            repositories,
            flaggedStudents,
            activityTrend,
            riskDistribution,
        });

    } catch (err) {
        console.error("Overview Error:", err);
        res.status(500).json({ message: "Overview fetch failed" });
    }
};
