const axios = require("axios");
const { analyzeCommitQuality } = require("../utils/commitQualityChecker");
const { analyzeCommitPatterns } = require("../utils/commitPatternAnalyzer");

const PER_PAGE = 100;
const DEFAULT_TIMEOUT_MS = 30000;
const API_VERSION_PATH = "/api/v4";

const normalizeBaseUrl = (value = "") =>
  String(value || "").trim().replace(/\/+$/, "");

const toApiBaseUrl = (value = "") => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return "";
  if (normalized.endsWith(API_VERSION_PATH)) return normalized;
  return `${normalized}${API_VERSION_PATH}`;
};

const getConfiguredBaseUrl = () => toApiBaseUrl(process.env.GITLAB_BASE_URL);

const getGitLabToken = (baseUrl = "") => {
  if (baseUrl.includes("campus.cs.le.ac.uk")) {
    return process.env.UNI_GITLAB_TOKEN || process.env.GITLAB_TOKEN;
  }
  return process.env.GITLAB_TOKEN || process.env.UNI_GITLAB_TOKEN;
};

const createGitLabClient = (baseUrl) => {
  const resolvedBaseUrl = toApiBaseUrl(baseUrl) || getConfiguredBaseUrl();
  if (!resolvedBaseUrl) {
    throw new Error("GitLab base URL is not configured");
  }

  const token = getGitLabToken(resolvedBaseUrl);
  const headers = {
    Accept: "application/json",
    "User-Agent": "git-tracker-tool",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["PRIVATE-TOKEN"] = token;
  }

  return axios.create({
    baseURL: resolvedBaseUrl,
    headers,
    timeout: DEFAULT_TIMEOUT_MS,
  });
};

const extractTotalFromHeaders = (headers = {}) => {
  const totalHeader = Number(headers["x-total"]);
  if (Number.isFinite(totalHeader)) return totalHeader;

  const linkHeader = headers.link || headers.Link;
  if (!linkHeader) return 0;

  const match = String(linkHeader).match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (!match) return 0;

  const pages = Number(match[1]);
  return Number.isFinite(pages) ? pages : 0;
};

const fetchPaginated = async (client, endpoint, params = {}) => {
  const all = [];
  let page = 1;

  while (true) {
    const response = await client.get(endpoint, {
      params: {
        ...params,
        per_page: PER_PAGE,
        page,
      },
    });

    const rows = Array.isArray(response.data) ? response.data : [];
    if (rows.length === 0) break;

    all.push(...rows);

    const nextPage = Number(response.headers["x-next-page"] || 0);
    if (nextPage) {
      page = nextPage;
      continue;
    }

    if (rows.length < PER_PAGE) break;
    page += 1;
  }

  return all;
};

const resolveProject = async (client, owner, repo) => {
  const namespace = `${owner}/${repo}`;
  const encoded = encodeURIComponent(namespace);

  try {
    const response = await client.get(`/projects/${encoded}`);
    return response.data;
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  const searchResponse = await client.get("/projects", {
    params: {
      search: repo,
      simple: true,
      per_page: PER_PAGE,
    },
  });

  const target = (searchResponse.data || []).find(
    (project) =>
      String(project.path_with_namespace || "").toLowerCase() ===
      namespace.toLowerCase()
  );

  if (!target) {
    throw new Error(`GitLab project not found: ${namespace}`);
  }

  return target;
};

const normalizeDate = (commit = {}) =>
  commit.created_at || commit.committed_date || commit.authored_date || null;

const getAllGitLabCommits = async (baseUrl, owner, repo) => {
  const gitlab = createGitLabClient(baseUrl);
  const project = await resolveProject(gitlab, owner, repo);

  const branchRows = await fetchPaginated(
    gitlab,
    `/projects/${project.id}/repository/branches`
  );

  const branches =
    branchRows.length > 0
      ? branchRows
      : project.default_branch
        ? [{ name: project.default_branch }]
        : [];

  const unique = new Map();

  for (const branch of branches) {
    const branchCommits = await fetchPaginated(
      gitlab,
      `/projects/${project.id}/repository/commits`,
      { ref_name: branch.name }
    );

    branchCommits.forEach((commit) => {
      const sha = commit.id || commit.short_id;
      if (!sha) return;

      if (!unique.has(sha)) {
        unique.set(sha, {
          ...commit,
          branches: new Set([branch.name]),
        });
        return;
      }

      unique.get(sha).branches.add(branch.name);
    });
  }

  const commits = Array.from(unique.values())
    .map((commit) => ({
      ...commit,
      branches: Array.from(commit.branches || []),
      branch: Array.from(commit.branches || [])[0] || project.default_branch || "main",
    }))
    .sort((a, b) => new Date(normalizeDate(b)) - new Date(normalizeDate(a)));

  return {
    gitlab,
    project,
    commits,
  };
};

const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

const getUsernameFromIdentity = ({ email, name }) => {
  const normalizedEmail = String(email || "").toLowerCase();
  if (normalizedEmail.includes("@")) {
    return normalizedEmail.split("@")[0];
  }
  return slugify(name) || "unknown";
};

const enrichGitLabCommit = async (client, projectId, commit, moduleConfig = {}) => {
  const sha = commit.id || commit.short_id;

  const detailsResponse = await client.get(
    `/projects/${projectId}/repository/commits/${sha}`,
    {
      params: { stats: true },
    }
  );

  const details = detailsResponse.data || {};
  const message =
    details.title ||
    String(details.message || commit.title || "").split("\n")[0] ||
    "";
  const timestamp = normalizeDate(details) || normalizeDate(commit) || new Date().toISOString();
  const additions = Number(details.stats?.additions || 0);
  const deletions = Number(details.stats?.deletions || 0);

  const quality = analyzeCommitQuality({
    message,
    additions,
    deletions,
    patch: null,
    config: moduleConfig,
  });

  return {
    sha,
    message,
    timestamp,
    additions,
    deletions,
    branch:
      Array.isArray(commit.branches) && commit.branches.length
        ? commit.branches.join(", ")
        : commit.branch || "main",
    qualityScore: quality.qualityScore,
    isLowQuality: quality.qualityScore < 60,
    isGenericMessage: quality.isGenericMessage,
    isSmallCommit: quality.isSmallCommit,
    isWhitespaceOnly: quality.isWhitespaceOnly,
    authorEmail: details.author_email || commit.author_email || "unknown@example.com",
    authorName: details.author_name || commit.author_name || "Unknown",
  };
};

exports.fetchGitLabRepoData = async (baseUrl, owner, repo) => {
  try {
    const gitlab = createGitLabClient(baseUrl);
    const project = await resolveProject(gitlab, owner, repo);

    const commitsResponse = await gitlab.get(
      `/projects/${project.id}/repository/commits`,
      {
        params: { per_page: 1 },
      }
    );

    let totalCommits = extractTotalFromHeaders(commitsResponse.headers);
    if (!totalCommits && Array.isArray(commitsResponse.data) && commitsResponse.data.length) {
      totalCommits = 1;
    }

    return {
      name: project.name,
      fullName: project.path_with_namespace,
      defaultBranch: project.default_branch,
      visibility: project.visibility,
      lastCommitDate: commitsResponse.data?.[0]?.created_at || null,
      totalCommits,
    };
  } catch (error) {
    console.error("GitLab Repo Error:", error.response?.data || error.message);
    throw new Error("GitLab API fetch failed");
  }
};

exports.fetchGitLabAllCommits = async (baseUrl, owner, repo) => {
  try {
    const { commits } = await getAllGitLabCommits(baseUrl, owner, repo);
    return commits;
  } catch (error) {
    console.error(
      "GitLab All Commits Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch all GitLab commits");
  }
};

exports.fetchGitLabContributors = async (
  baseUrl,
  owner,
  repo,
  moduleConfig = {}
) => {
  try {
    const { gitlab, project, commits } = await getAllGitLabCommits(
      baseUrl,
      owner,
      repo
    );

    const contributorsMap = new Map();

    for (const commit of commits) {
      const enriched = await enrichGitLabCommit(
        gitlab,
        project.id,
        commit,
        moduleConfig
      );

      const emailKey = String(enriched.authorEmail || "unknown@example.com").toLowerCase();
      const contributorKey = emailKey || `${enriched.authorName}:${enriched.sha}`;

      if (!contributorsMap.has(contributorKey)) {
        contributorsMap.set(contributorKey, {
          name: enriched.authorName || "Unknown",
          email: enriched.authorEmail || "unknown@example.com",
          username: getUsernameFromIdentity({
            email: enriched.authorEmail,
            name: enriched.authorName,
          }),
          totalCommits: 0,
          commits: [],
          lowQualityCommits: 0,
        });
      }

      const contributor = contributorsMap.get(contributorKey);
      contributor.totalCommits += 1;
      if (enriched.isLowQuality) {
        contributor.lowQualityCommits += 1;
      }

      contributor.commits.push({
        sha: enriched.sha,
        message: enriched.message,
        timestamp: enriched.timestamp,
        additions: enriched.additions,
        deletions: enriched.deletions,
        branch: enriched.branch,
        qualityScore: enriched.qualityScore,
        isLowQuality: enriched.isLowQuality,
        isGenericMessage: enriched.isGenericMessage,
        isSmallCommit: enriched.isSmallCommit,
        isWhitespaceOnly: enriched.isWhitespaceOnly,
      });
    }

    const totalProjectCommits = commits.length;

    return Array.from(contributorsMap.values()).map((contributor) => {
      const patterns = analyzeCommitPatterns(contributor.commits, moduleConfig);
      const inactivityGaps = patterns.inactivityGaps || [];

      return {
        ...contributor,
        contributionPercentage: totalProjectCommits
          ? ((contributor.totalCommits / totalProjectCommits) * 100).toFixed(1)
          : 0,
        inactivityGaps,
        inactivityFlag: inactivityGaps.length > 0,
        deadlineSpike: !!patterns.deadlineSpike,
        commitsByDate: patterns.commitsByDate || {},
      };
    });
  } catch (error) {
    console.error("GitLab Contributor Error:", error.response?.data || error.message || error);
    throw new Error("Failed to fetch GitLab contributor analytics");
  }
};
