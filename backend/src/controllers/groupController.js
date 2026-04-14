const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const parseId = (value) => parseInt(value, 10);

const getOwnedGroup = (groupId, convenorId, include = {}) =>
  prisma.group.findFirst({
    where: {
      id: groupId,
      module: {
        convenorId,
      },
    },
    include: {
      module: true,
      ...include,
    },
  });

// CREATE GROUP
exports.createGroup = async (req, res) => {
  try {
    const { name, moduleId, repositoryUrl, platform } = req.body;
    const parsedModuleId = parseId(moduleId);


    const moduleRecord = await prisma.module.findFirst({
      where: {
        id: parsedModuleId,
        convenorId: req.user.id,
      },
    });

    if (!moduleRecord) {
      return res.status(403).json({ message: "Unauthorized module access" });
    }

    if (!repositoryUrl) {
      return res.status(400).json({
        message: "Repository URL is required",
      });
    }

    const group = await prisma.group.create({
      data: {
        name,
        moduleId: parsedModuleId,
      },
    });

        //  Step 2: Create repository separately
    await prisma.repository.create({
      data: {
        name: "Repository",
        url: repositoryUrl,
        platform,
        groupId: group.id,
      },
    });

    return res.status(201).json(group);
  } catch (error) {
    console.error("CREATE GROUP ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

// GET GROUPS BY MODULE
exports.getGroupsByModule = async (req, res) => {
  try {
    const moduleId = parseId(req.params.moduleId);

    const groups = await prisma.group.findMany({
      where: {
        moduleId,
        module: {
          is: {
            convenorId: req.user.id,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET ALL GROUPS FOR CONVENOR
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        module: {
          convenorId: req.user.id,
        },
      },
      include: {
        module: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE GROUP
exports.updateGroup = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const { name } = req.body;

    const group = await getOwnedGroup(id, req.user.id);
    if (!group) return res.status(403).json({ message: "Unauthorized" });

    const updated = await prisma.group.update({
      where: { id },
      data: { name },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE GROUP
exports.deleteGroup = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const group = await getOwnedGroup(id, req.user.id, {
      repo: {
        select: { id: true },
      },
      students: {
        select: { id: true },
      },
    });

    if (!group) return res.status(403).json({ message: "Unauthorized" });

    const studentIds = group.students.map((student) => student.id);
    const repositoryId = group.repo?.id;

    await prisma.$transaction(async (tx) => {
      if (repositoryId) {
        await tx.commit.deleteMany({
          where: { repositoryId },
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

      await tx.student.deleteMany({
        where: { groupId: id },
      });

      await tx.repository.deleteMany({
        where: { groupId: id },
      });

      await tx.group.delete({ where: { id } });
    });

    return res.json({ message: "Group deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET STUDENT IDENTITY MAPPINGS FOR A GROUP
exports.getGroupStudents = async (req, res) => {
  try {
    const groupId = parseId(req.params.id);
    const group = await getOwnedGroup(groupId, req.user.id, {
      students: {
        include: {
          identities: true,
        },
      },
    });

    if (!group) return res.status(404).json({ message: "Group not found" });
    return res.json(group.students);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// SAVE STUDENT IDENTITY MAPPINGS FOR A GROUP
exports.saveGroupStudents = async (req, res) => {
  try {
    const groupId = parseId(req.params.id);
    const payloadStudents = Array.isArray(req.body.students)
      ? req.body.students
      : [];

    const group = await getOwnedGroup(groupId, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const sanitizedStudents = payloadStudents
      .map((student) => ({
        name: (student.name || "").trim(),
        universityId: (student.universityId || "").trim(),
        identities: Array.isArray(student.identities)
          ? student.identities
            .map((identity) => ({
              gitEmail: (identity.gitEmail || "").trim(),
              gitUsername: (identity.gitUsername || "").trim(),
            }))
            .filter((identity) => identity.gitEmail || identity.gitUsername)
          : [],
      }))
      .filter((student) => student.name && student.universityId);

    await prisma.$transaction(async (tx) => {
      await tx.identityMapping.deleteMany({
        where: {
          student: {
            groupId,
          },
        },
      });

      await tx.student.deleteMany({
        where: { groupId },
      });

      for (const student of sanitizedStudents) {
        await tx.student.create({
          data: {
            name: student.name,
            universityId: student.universityId,
            groupId,
            identities: {
              create: student.identities,
            },
          },
        });
      }
    });

    const updatedStudents = await prisma.student.findMany({
      where: { groupId },
      include: { identities: true },
      orderBy: { id: "asc" },
    });

    return res.json(updatedStudents);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
