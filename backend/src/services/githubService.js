const axios = require("axios");
const { analyzeCommitQuality } = require("../utils/commitQualityChecker");
const { analyzeCommitPatterns } = require("../utils/commitPatternAnalyzer");

const createGitHubClient = () => {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "git-tracker-tool",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return axios.create({
    baseURL: "https://api.github.com",
    headers,
  });
};

const fetchPaginated = async (client, endpoint, params = {}) => {
  const all = [];
  let page = 1;

  while (true) {
    const response = await client.get(endpoint, {
      params: {
        ...params,
        per_page: 100,
        page,
      },
    });

    const rows = response.data || [];
    if (!Array.isArray(rows) || rows.length === 0) break;

    all.push(...rows);
    if (rows.length < 100) break;

    page += 1;
  }

  return all;
};

exports.fetchGitHubRepoData = async (owner, repo) => {
  try {
    const github = createGitHubClient();

    const [repoResponse, commitsResponse] = await Promise.all([
      github.get(`/repos/${owner}/${repo}`),
      github.get(`/repos/${owner}/${repo}/commits`, { params: { per_page: 1 } }),
    ]);

    const linkHeader = commitsResponse.headers.link;
    let totalCommits = 1;

    if (linkHeader) {
      const match = linkHeader.match(/[?&]page=(\d+)>;\s*rel="last"/);
      if (match) totalCommits = parseInt(match[1], 10);
    }

    return {
      name: repoResponse.data.name,
      fullName: repoResponse.data.full_name,
      defaultBranch: repoResponse.data.default_branch,
      visibility: repoResponse.data.visibility,
      lastCommitDate: commitsResponse.data[0]?.commit?.author?.date,
      totalCommits,
    };
  } catch (error) {
    console.error("GitHub Repo Error:", error.response?.data || error.message);
    throw new Error("GitHub API fetch failed");
  }
};

exports.fetchGitHubAllCommits = async (owner, repo) => {
  try {
    const github = createGitHubClient();

    const branches = await fetchPaginated(
      github,
      `/repos/${owner}/${repo}/branches`
    );

    const unique = new Map();

    for (const branch of branches) {
      const branchCommits = await fetchPaginated(
        github,
        `/repos/${owner}/${repo}/commits`,
        { sha: branch.name }
      );

      branchCommits.forEach((commit) => {
        if (!unique.has(commit.sha)) {
          unique.set(commit.sha, commit);
        }
      });
    }

    const commits = Array.from(unique.values());
    commits.sort(
      (a, b) =>
        new Date(b.commit?.author?.date || 0) -
        new Date(a.commit?.author?.date || 0)
    );

    return commits;
  } catch (error) {
    console.error("GitHub All Commits Error:", error.response?.data || error.message);
    throw new Error("Failed to fetch all GitHub commits");
  }
};

exports.fetchGitHubContributors = async (owner, repo, moduleConfig = {}) => {
  try {
    const github = createGitHubClient();
    const commits = await exports.fetchGitHubAllCommits(owner, repo);

    const contributorsMap = {};

    for (const commit of commits) {
      const sha = commit.sha;
      const detailsResponse = await github.get(
        `/repos/${owner}/${repo}/commits/${sha}`
      );
      const details = detailsResponse.data;

      const message =
        details.commit?.message?.split("\n")?.[0] ||
        commit.commit?.message?.split("\n")?.[0] ||
        "";
      const timestamp =
        details.commit?.author?.date || commit.commit?.author?.date;
      const email =
        details.commit?.author?.email ||
        commit.commit?.author?.email ||
        "unknown@example.com";
      const name =
        details.commit?.author?.name ||
        commit.commit?.author?.name ||
        commit.author?.login ||
        "Unknown";

      const additions = details.stats?.additions || 0;
      const deletions = details.stats?.deletions || 0;
      const patch = (details.files || [])
        .map((file) => file.patch || "")
        .join("\n");

      const quality = analyzeCommitQuality({
        message,
        additions,
        deletions,
        patch,
        config: moduleConfig,
      });

      if (!contributorsMap[email]) {
        contributorsMap[email] = {
          name,
          email,
          username: commit.author?.login || email.split("@")[0],
          totalCommits: 0,
          commits: [],
          lowQualityCommits: 0,
        };
      }

      contributorsMap[email].totalCommits += 1;
      if (quality.qualityScore < 60) {
        contributorsMap[email].lowQualityCommits += 1;
      }

      contributorsMap[email].commits.push({
        sha,
        message,
        timestamp,
        additions,
        deletions,
        branch: "main",
        qualityScore: quality.qualityScore,
        isLowQuality: quality.qualityScore < 60,
        isGenericMessage: quality.isGenericMessage,
        isSmallCommit: quality.isSmallCommit,
        isWhitespaceOnly: quality.isWhitespaceOnly,
      });
    }

    const totalProjectCommits = commits.length;

    return Object.values(contributorsMap).map((contributor) => {
      const patterns = analyzeCommitPatterns(contributor.commits, moduleConfig);

      return {
        ...contributor,
        contributionPercentage: totalProjectCommits
          ? ((contributor.totalCommits / totalProjectCommits) * 100).toFixed(1)
          : 0,
        inactivityGaps: patterns.inactivityGaps,
        inactivityFlag: (patterns.inactivityGaps || []).length > 0,
        belowExpectedCommits: !!patterns.belowExpectedCommits,
        expectedCommitsTarget: patterns.expectedCommitsTarget,
        actualCommits: patterns.actualCommits,
        deadlineSpike: patterns.deadlineSpike,
        commitsByDate: patterns.commitsByDate,
      };
    });
  } catch (error) {
    console.error(
      "GitHub Contributors Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch GitHub contributor analytics");
  }
};
