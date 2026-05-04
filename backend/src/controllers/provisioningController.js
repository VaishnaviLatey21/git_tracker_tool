const { PrismaClient } = require("@prisma/client");
const {
  addOrUpdateProjectMember,
  createGitLabClient,
  createGitLabProject,
  deleteGitLabProject,
  findGitLabUser,
  parseErrorMessage,
  parseGitLabAccessLevel,
  resolveNamespaceId,
} = require("../services/gitlabProvisioningService");

const prisma = new PrismaClient();

const parseId = (value) => Number.parseInt(value, 10);

const sanitizeValue = (value) => String(value || "").trim();

const dedupeIdentities = (identities = []) => {
  const seen = new Set();
  const output = [];

  for (const identity of identities) {
    const gitUsername = sanitizeValue(identity.gitUsername);
    const gitEmail = sanitizeValue(identity.gitEmail).toLowerCase();

    if (!gitUsername && !gitEmail) continue;

    const key = `${gitUsername.toLowerCase()}::${gitEmail}`;
    if (seen.has(key)) continue;
    seen.add(key);

    output.push({
      gitUsername,
      gitEmail,
    });
  }

  return output;
};

const normalizeStudent = (student = {}) => {
  const name = sanitizeValue(student.name);
  const universityId = sanitizeValue(student.universityId);
  const directIdentity = {
    gitUsername: sanitizeValue(student.gitUsername),
    gitEmail: sanitizeValue(student.gitEmail),
  };

  const nestedIdentities = Array.isArray(student.identities)
    ? student.identities
    : [];

  const identities = dedupeIdentities([directIdentity, ...nestedIdentities]);

  return {
    name,
    universityId,
    identities,
  };
};

const chunkArray = (items = [], size = 4) => {
  const output = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }
  return output;
};

const summarizeAssignments = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

const getPrimaryIdentity = (student) =>
  (student.identities || []).find((identity) => identity.gitUsername || identity.gitEmail) ||
  null;

const buildStudentCreateInput = (student) => {
  const data = {
    name: student.name,
    universityId: student.universityId,
  };

  if (student.identities.length > 0) {
    data.identities = {
      create: student.identities.map((identity) => ({
        gitUsername: identity.gitUsername || "",
        gitEmail: identity.gitEmail || "",
      })),
    };
  }

  return data;
};

exports.autoCreateGroupsAndProvisionGitLab = async (req, res) => {
  try {
    const moduleId = parseId(req.params.id);
    if (!moduleId) {
      return res.status(400).json({ message: "Invalid module id" });
    }

    const {
      students = [],
      groupSize = 4,
      groupPrefix = "Group",
      namespaceId,
      namespacePath,
      projectPrefix,
      visibility = "private",
      accessLevel = "DEVELOPER",
      initializeWithReadme = true,
      allowExistingGroups = true,
      dryRun = false,
    } = req.body || {};

    const parsedGroupSize = Math.max(1, Number.parseInt(groupSize, 10) || 4);
    if (parsedGroupSize < 2) {
      return res.status(400).json({ message: "groupSize should be at least 2" });
    }

    const moduleRecord = await prisma.module.findFirst({
      where: {
        id: moduleId,
        convenorId: req.user.id,
      },
      select: {
        id: true,
        name: true,
        year: true,
      },
    });

    if (!moduleRecord) {
      return res.status(404).json({ message: "Module not found or unauthorized" });
    }

    const existingGroupCount = await prisma.group.count({
      where: { moduleId },
    });

    if (!allowExistingGroups && existingGroupCount > 0) {
      return res.status(400).json({
        message:
          "This module already has groups. Use allowExistingGroups=true to append new groups.",
      });
    }

    const sanitizedStudents = (Array.isArray(students) ? students : [])
      .map(normalizeStudent)
      .filter((student) => student.name && student.universityId);

    if (sanitizedStudents.length === 0) {
      return res.status(400).json({
        message: "No valid students found. Include name and universityId for each student.",
      });
    }

    const studentGroups = chunkArray(sanitizedStudents, parsedGroupSize);
    const provisioningPlan = studentGroups.map((groupStudents, index) => {
      const sequence = existingGroupCount + index + 1;
      const groupName = `${sanitizeValue(groupPrefix) || "Group"}${String(sequence).padStart(2, "0")}`;
      const projectName = sanitizeValue(projectPrefix)
        ? `${sanitizeValue(projectPrefix)}-${groupName}`
        : `${moduleRecord.name}-${groupName}`;

      return {
        sequence,
        groupName,
        projectName,
        students: groupStudents,
      };
    });

    if (dryRun) {
      return res.json({
        message: "Dry run completed",
        module: moduleRecord,
        totalStudents: sanitizedStudents.length,
        groupSize: parsedGroupSize,
        plannedGroups: provisioningPlan.map((item) => ({
          sequence: item.sequence,
          groupName: item.groupName,
          projectName: item.projectName,
          students: item.students.map((student) => ({
            name: student.name,
            universityId: student.universityId,
            identityCount: student.identities.length,
          })),
        })),
      });
    }

    const gitlab = createGitLabClient(process.env.GITLAB_BASE_URL);
    const resolvedNamespaceId = await resolveNamespaceId(
      gitlab,
      namespaceId,
      namespacePath
    );

    if ((namespaceId || namespacePath) && !resolvedNamespaceId) {
      return res.status(400).json({
        message: "Namespace not found. Check namespaceId or namespacePath.",
      });
    }

    const parsedAccessLevel = parseGitLabAccessLevel(accessLevel);
    const results = [];

    for (const plan of provisioningPlan) {
      const groupResult = {
        groupName: plan.groupName,
        projectName: plan.projectName,
        studentCount: plan.students.length,
        status: "pending",
        project: null,
        assignmentResults: [],
        assignmentSummary: {},
      };

      let createdProject = null;

      try {
        createdProject = await createGitLabProject(gitlab, {
          projectName: plan.projectName,
          namespaceId: resolvedNamespaceId,
          visibility,
          initializeWithReadme,
        });

        groupResult.project = {
          id: createdProject.id,
          url: createdProject.web_url,
          pathWithNamespace: createdProject.path_with_namespace,
        };

        for (const student of plan.students) {
          const primaryIdentity = getPrimaryIdentity(student);
          if (!primaryIdentity) {
            groupResult.assignmentResults.push({
              studentName: student.name,
              universityId: student.universityId,
              status: "mapping_missing",
            });
            continue;
          }

          let user = null;
          try {
            user = await findGitLabUser(gitlab, primaryIdentity);
          } catch (error) {
            groupResult.assignmentResults.push({
              studentName: student.name,
              universityId: student.universityId,
              status: "failed",
              message: parseErrorMessage(error),
            });
            continue;
          }

          if (!user) {
            groupResult.assignmentResults.push({
              studentName: student.name,
              universityId: student.universityId,
              status: "user_not_found",
            });
            continue;
          }

          const assignment = await addOrUpdateProjectMember(
            gitlab,
            createdProject.id,
            user.id,
            parsedAccessLevel
          );

          groupResult.assignmentResults.push({
            studentName: student.name,
            universityId: student.universityId,
            gitlabUsername: user.username,
            status: assignment.status,
            message: assignment.message || null,
          });
        }

        const createdGroup = await prisma.group.create({
          data: {
            name: plan.groupName,
            moduleId,
            repo: {
              create: {
                name: createdProject.name || plan.projectName,
                url: createdProject.web_url,
                platform: "GITLAB",
              },
            },
            students: {
              create: plan.students.map(buildStudentCreateInput),
            },
          },
          include: {
            repo: true,
          },
        });

        groupResult.groupId = createdGroup.id;
        groupResult.repositoryId = createdGroup.repo?.id || null;
        groupResult.status = "created";
        groupResult.assignmentSummary = summarizeAssignments(
          groupResult.assignmentResults
        );
      } catch (error) {
        groupResult.status = "failed";
        groupResult.error = parseErrorMessage(error);

        if (createdProject?.id) {
          try {
            await deleteGitLabProject(gitlab, createdProject.id);
            groupResult.cleanup = "project_deleted";
          } catch (_cleanupError) {
            groupResult.cleanup = "manual_project_cleanup_required";
          }
        }
      }

      results.push(groupResult);
    }

    const summary = results.reduce(
      (acc, row) => {
        acc.totalGroups += 1;
        if (row.status === "created") acc.createdGroups += 1;
        if (row.status === "failed") acc.failedGroups += 1;
        return acc;
      },
      { totalGroups: 0, createdGroups: 0, failedGroups: 0 }
    );

    return res.status(201).json({
      message: "Auto group provisioning completed",
      module: moduleRecord,
      groupSize: parsedGroupSize,
      totalStudents: sanitizedStudents.length,
      summary,
      results,
    });
  } catch (error) {
    return res.status(500).json({ message: parseErrorMessage(error) });
  }
};

