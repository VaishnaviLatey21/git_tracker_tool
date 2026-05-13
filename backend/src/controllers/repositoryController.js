const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { parseRepositoryUrl } = require("../utils/repoParser");
const { fetchGitHubRepoData } = require("../services/githubService");
const {
  fetchGitLabRepoData,
  fetchGitLabBranchTipShas,
} = require("../services/gitlabService");
const {
  fetchRepositoryContributorsWithIdentity,
  fetchStoredRepositoryContributorsWithIdentity,
  persistContributorCommits,
} = require("../services/repositoryAnalyticsService");

const normalizeThreshold = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const parseGroupId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getGroupOwnedByConvenor = async (groupId, convenorId) =>
  prisma.group.findFirst({
    where: {
      id: groupId,
      module: {
        convenorId,
      },
    },
    include: {
      module: true,
      students: {
        include: {
          identities: true,
        },
      },
      repo: true,
    },
  });

const getRepositoryOwnedByConvenor = async (groupId, convenorId) =>
  prisma.repository.findFirst({
    where: {
      groupId,
      group: {
        module: {
          convenorId,
        },
      },
    },
    include: {
      group: {
        include: {
          module: true,
          students: {
            include: {
              identities: true,
            },
          },
        },
      },
    },
  });

const extractModuleConfig = (module) => ({
  inactivityDays: normalizeThreshold(module?.inactivityDays, 7),
  minExpectedCommits: normalizeThreshold(module?.minExpectedCommits, 3),
  smallCommitThreshold: normalizeThreshold(module?.smallCommitThreshold, 5),
});

const getRemoteTotalCommits = async (repository) => {
  try {
    const { baseUrl, owner, repo } = parseRepositoryUrl(repository.url);
    const platform = (repository.platform || "").toUpperCase();

    const overview =
      platform === "GITHUB"
        ? await fetchGitHubRepoData(owner, repo)
        : await fetchGitLabRepoData(baseUrl, owner, repo);

    const total = Number(overview?.totalCommits || 0);
    return Number.isFinite(total) && total >= 0 ? total : null;
  } catch (_error) {
    return null;
  }
};

const hasMissingGitLabBranchTips = async (repository) => {
  try {
    if ((repository.platform || "").toUpperCase() !== "GITLAB") {
      return false;
    }

    const { baseUrl, owner, repo } = parseRepositoryUrl(repository.url);
    const tipShas = await fetchGitLabBranchTipShas(baseUrl, owner, repo);
    if (!tipShas.length) return false;

    const matchedTipCount = await prisma.commit.count({
      where: {
        repositoryId: repository.id,
        sha: { in: tipShas },
      },
    });

    return matchedTipCount < tipShas.length;
  } catch (_error) {
    return false;
  }
};

const shouldRefreshFromRemote = async (
  repository,
  storedCommitCount,
  forceRefresh
) => {
  if (forceRefresh) return true;
  if (!storedCommitCount) return true;

  const hasMissingTips = await hasMissingGitLabBranchTips(repository);
  if (hasMissingTips) return true;

  const remoteTotal = await getRemoteTotalCommits(repository);
  if (remoteTotal == null) return false;

  return remoteTotal > storedCommitCount;
};

// CREATE OR UPDATE REPOSITORY
exports.linkRepository = async (req, res) => {
  try {
    const { groupId, url, platform } = req.body;
    const parsedGroupId = parseGroupId(groupId);
    const normalizedPlatform = (platform || "").toUpperCase();

    if (!parsedGroupId || !url || !normalizedPlatform) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["GITHUB", "GITLAB"].includes(normalizedPlatform)) {
      return res.status(400).json({ message: "Invalid repository platform" });
    }

    const group = await getGroupOwnedByConvenor(parsedGroupId, req.user.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found or unauthorized" });
    }

    const existingRepo = await prisma.repository.findUnique({
      where: { groupId: parsedGroupId },
    });

    if (existingRepo) {
      const updated = await prisma.repository.update({
        where: { groupId: parsedGroupId },
        data: {
          url,
          platform: normalizedPlatform,
          name: url.replace(/\/$/, "").split("/").pop(),
          lastSyncedAt: null,
        },
      });

      return res.json(updated);
    }

    const created = await prisma.repository.create({
      data: {
        name: url.replace(/\/$/, "").split("/").pop(),
        url,
        platform: normalizedPlatform,
        groupId: parsedGroupId,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("Repository link error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET REPOSITORY BY GROUP
exports.getRepositoryByGroup = async (req, res) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await getGroupOwnedByConvenor(groupId, req.user.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found or unauthorized" });
    }

    const repository = await prisma.repository.findUnique({
      where: { groupId },
    });

    return res.json(repository);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE REPOSITORY
exports.deleteRepository = async (req, res) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const repository = await getRepositoryOwnedByConvenor(groupId, req.user.id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found or unauthorized" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.commit.deleteMany({
        where: { repositoryId: repository.id },
      });

      await tx.repository.delete({
        where: { groupId },
      });
    });

    return res.json({ message: "Repository removed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET REPOSITORY OVERVIEW
exports.getRepositoryOverview = async (req, res) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const repository = await getRepositoryOwnedByConvenor(groupId, req.user.id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found or unauthorized" });
    }

    if (
      repository.lastSyncedAt &&
      new Date(repository.lastSyncedAt) > new Date(Date.now() - 10 * 60 * 1000)
    ) {
      return res.json({
        name: repository.name,
        defaultBranch: repository.defaultBranch,
        visibility: repository.visibility,
        totalCommits: repository.totalCommits,
        lastCommitDate: repository.lastCommitDate,
        cached: true,
      });
    }

    const { baseUrl, owner, repo } = parseRepositoryUrl(repository.url);
    const platform = (repository.platform || "").toUpperCase();

    const overview =
      platform === "GITHUB"
        ? await fetchGitHubRepoData(owner, repo)
        : await fetchGitLabRepoData(baseUrl, owner, repo);

    await prisma.repository.update({
      where: { groupId },
      data: {
        defaultBranch: overview.defaultBranch,
        visibility: overview.visibility,
        totalCommits: overview.totalCommits,
        lastCommitDate: overview.lastCommitDate
          ? new Date(overview.lastCommitDate)
          : null,
        lastSyncedAt: new Date(),
      },
    });

    return res.json({
      ...overview,
      cached: false,
    });
  } catch (error) {
    console.error("Repository overview error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET REPOSITORY CONTRIBUTORS
exports.getRepositoryContributors = async (req, res) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const forceRefresh =
      String(req.query.refresh || "").toLowerCase() === "true" ||
      String(req.query.refresh || "") === "1";

    const repository = await getRepositoryOwnedByConvenor(groupId, req.user.id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found or unauthorized" });
    }

    const moduleConfig = extractModuleConfig(repository.group?.module);
    const students = repository.group?.students || [];

    const storedCommitCount = await prisma.commit.count({
      where: { repositoryId: repository.id },
    });

    const shouldRefresh = await shouldRefreshFromRemote(
      repository,
      storedCommitCount,
      forceRefresh
    );

    if (!shouldRefresh && storedCommitCount > 0) {
      const { mappedContributors } =
        await fetchStoredRepositoryContributorsWithIdentity(
          prisma,
          repository.id,
          moduleConfig,
          students
        );
      return res.json(mappedContributors);
    }

    const { rawContributors, mappedContributors } =
      await fetchRepositoryContributorsWithIdentity(
        repository,
        moduleConfig,
        students
      );

    await persistContributorCommits(prisma, repository.id, rawContributors);
    await prisma.repository.update({
      where: { id: repository.id },
      data: {
        lastSyncedAt: new Date(),
        totalCommits: rawContributors.reduce(
          (sum, contributor) => sum + Number(contributor.totalCommits || 0),
          0
        ),
      },
    });

    return res.json(mappedContributors);
  } catch (error) {
    console.error("Contributors error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET CONSOLIDATED COMMITS
exports.getConsolidatedCommits = async (req, res) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const forceRefresh =
      String(req.query.refresh || "").toLowerCase() === "true" ||
      String(req.query.refresh || "") === "1";

    const repository = await getRepositoryOwnedByConvenor(groupId, req.user.id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found or unauthorized" });
    }

    const moduleConfig = extractModuleConfig(repository.group?.module);
    const students = repository.group?.students || [];

    const storedCommitCount = await prisma.commit.count({
      where: { repositoryId: repository.id },
    });

    const shouldRefresh = await shouldRefreshFromRemote(
      repository,
      storedCommitCount,
      forceRefresh
    );

    if (!shouldRefresh && storedCommitCount > 0) {
      const { mappedContributors } =
        await fetchStoredRepositoryContributorsWithIdentity(
          prisma,
          repository.id,
          moduleConfig,
          students
        );
      return res.json(mappedContributors);
    }

    const { rawContributors, mappedContributors } =
      await fetchRepositoryContributorsWithIdentity(
      repository,
      moduleConfig,
      students
    );

    await persistContributorCommits(prisma, repository.id, rawContributors);
    await prisma.repository.update({
      where: { id: repository.id },
      data: {
        lastSyncedAt: new Date(),
        totalCommits: rawContributors.reduce(
          (sum, contributor) => sum + Number(contributor.totalCommits || 0),
          0
        ),
      },
    });

    return res.json(mappedContributors);
  } catch (error) {
    console.error("Consolidated commits error:", error);
    return res.status(500).json({ message: error.message });
  }
};
