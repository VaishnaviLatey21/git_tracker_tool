const { parseRepositoryUrl } = require("../utils/repoParser");
const {
  fetchGitHubContributors,
} = require("./githubService");
const {
  fetchGitLabContributors,
} = require("./gitlabService");
const {
  applyIdentityMappings,
} = require("../utils/contributorIdentityMapper");

const fetchRawContributorsByPlatform = async (
  repository,
  moduleConfig = {}
) => {
  const { baseUrl, owner, repo } = parseRepositoryUrl(repository.url);
  const platform = (repository.platform || "").toUpperCase();

  if (platform === "GITHUB") {
    return fetchGitHubContributors(owner, repo, moduleConfig);
  }

  return fetchGitLabContributors(baseUrl, owner, repo, moduleConfig);
};

exports.fetchRepositoryContributorsWithIdentity = async (
  repository,
  moduleConfig = {},
  students = []
) => {
  const rawContributors = await fetchRawContributorsByPlatform(
    repository,
    moduleConfig
  );

  const mappedContributors = applyIdentityMappings(
    rawContributors,
    students,
    moduleConfig
  );

  console.log("Contributors:", mappedContributors.length);
  console.log(
    "First contributor commits:",
    mappedContributors[0]?.commits?.length || 0
  );

  return {
    rawContributors,
    mappedContributors,
  };
};

exports.fetchStoredRepositoryContributorsWithIdentity = async (
  prisma,
  repositoryId,
  moduleConfig = {},
  students = []
) => {
  const commits = await prisma.commit.findMany({
    where: { repositoryId },
    orderBy: { timestamp: "desc" },
    select: {
      sha: true,
      message: true,
      authorName: true,
      authorEmail: true,
      timestamp: true,
      additions: true,
      deletions: true,
      branch: true,
      isLowQuality: true,
      isGenericMessage: true,
      isSmallCommit: true,
      isWhitespaceOnly: true,
      qualityScore: true,
    },
  });

  if (!commits.length) {
    return {
      rawContributors: [],
      mappedContributors: [],
    };
  }

  const rawMap = new Map();

  commits.forEach((commit) => {
    const email = commit.authorEmail || "unknown@example.com";
    if (!rawMap.has(email)) {
      rawMap.set(email, {
        name: commit.authorName || "Unknown",
        email,
        username: String(email).split("@")[0] || "unknown",
        totalCommits: 0,
        commits: [],
        lowQualityCommits: 0,
      });
    }

    const contributor = rawMap.get(email);
    const qualityScore =
      typeof commit.qualityScore === "number" ? commit.qualityScore : 100;

    contributor.totalCommits += 1;
    if (commit.isLowQuality || qualityScore < 60) {
      contributor.lowQualityCommits += 1;
    }

    contributor.commits.push({
      sha: commit.sha,
      message: commit.message || "",
      timestamp: commit.timestamp,
      additions: commit.additions || 0,
      deletions: commit.deletions || 0,
      branch: commit.branch || "main",
      qualityScore,
      isLowQuality: !!commit.isLowQuality || qualityScore < 60,
      isGenericMessage: !!commit.isGenericMessage,
      isSmallCommit: !!commit.isSmallCommit,
      isWhitespaceOnly: !!commit.isWhitespaceOnly,
    });
  });

  const rawContributors = Array.from(rawMap.values());
  const mappedContributors = applyIdentityMappings(
    rawContributors,
    students,
    moduleConfig
  );

  return {
    rawContributors,
    mappedContributors,
  };
};

exports.persistContributorCommits = async (
  prisma,
  repositoryId,
  contributors = []
) => {
  for (const contributor of contributors) {
    for (const commit of contributor.commits || []) {
      if (!commit.sha) continue;

      const qualityScore =
        typeof commit.qualityScore === "number" ? commit.qualityScore : 100;

      await prisma.commit.upsert({
        where: { sha: commit.sha },
        update: {
          message: commit.message || "",
          authorName: contributor.name || "Unknown",
          authorEmail: contributor.email || "unknown@example.com",
          timestamp: new Date(commit.timestamp),
          additions: commit.additions || 0,
          deletions: commit.deletions || 0,
          branch: commit.branch || "main",
          repositoryId,
          isLowQuality: qualityScore < 60,
          isGenericMessage: !!commit.isGenericMessage,
          isSmallCommit: !!commit.isSmallCommit,
          isWhitespaceOnly: !!commit.isWhitespaceOnly,
          qualityScore,
        },
        create: {
          sha: commit.sha,
          message: commit.message || "",
          authorName: contributor.name || "Unknown",
          authorEmail: contributor.email || "unknown@example.com",
          timestamp: new Date(commit.timestamp),
          additions: commit.additions || 0,
          deletions: commit.deletions || 0,
          branch: commit.branch || "main",
          repositoryId,
          isLowQuality: qualityScore < 60,
          isGenericMessage: !!commit.isGenericMessage,
          isSmallCommit: !!commit.isSmallCommit,
          isWhitespaceOnly: !!commit.isWhitespaceOnly,
          qualityScore,
        },
      });
    }
  }
};
