const { analyzeCommitPatterns } = require("./commitPatternAnalyzer");

const normalize = (value) => (value || "").trim().toLowerCase();

const inferUsername = (contributor) => {
  if (contributor?.username) return normalize(contributor.username);
  const email = normalize(contributor?.email);
  if (!email.includes("@")) return "";
  return email.split("@")[0];
};

const finalizeContributors = (contributors, moduleConfig = {}) => {
  const normalized = contributors.map((contributor) => {
    const commits = [...(contributor.commits || [])].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const lowQualityCommits = commits.filter(
      (commit) =>
        !!commit.isLowQuality ||
        (typeof commit.qualityScore === "number" && commit.qualityScore < 60)
    ).length;

    const patterns = analyzeCommitPatterns(commits, moduleConfig);

    return {
      ...contributor,
      commits,
      totalCommits: commits.length,
      lowQualityCommits,
      inactivityGaps: patterns.inactivityGaps,
      deadlineSpike: patterns.deadlineSpike,
      commitsByDate: patterns.commitsByDate,
    };
  });

  const totalRepoCommits = normalized.reduce(
    (sum, contributor) => sum + contributor.totalCommits,
    0
  );

  return normalized.map((contributor) => ({
    ...contributor,
    contributionPercentage: totalRepoCommits
      ? ((contributor.totalCommits / totalRepoCommits) * 100).toFixed(1)
      : 0,
  }));
};

exports.applyIdentityMappings = (
  contributors,
  students = [],
  moduleConfig = {}
) => {
  if (!students.length) {
    return finalizeContributors(contributors, moduleConfig);
  }

  const emailToStudent = new Map();
  const usernameToStudent = new Map();

  students.forEach((student) => {
    student.identities?.forEach((identity) => {
      const email = normalize(identity.gitEmail);
      const username = normalize(identity.gitUsername);
      if (email) emailToStudent.set(email, student);
      if (username) usernameToStudent.set(username, student);
    });
  });

  const merged = new Map();

  contributors.forEach((contributor) => {
    const contributorEmail = normalize(contributor.email);
    const contributorUsername = inferUsername(contributor);

    const mappedStudent =
      emailToStudent.get(contributorEmail) ||
      usernameToStudent.get(contributorUsername);

    const bucketKey = mappedStudent
      ? `student:${mappedStudent.id}`
      : `raw:${contributorEmail || contributorUsername || contributor.name}`;

    if (!merged.has(bucketKey)) {
      merged.set(bucketKey, {
        name: mappedStudent?.name || contributor.name || "Unknown",
        email:
          mappedStudent?.identities?.find((item) => item.gitEmail)?.gitEmail ||
          contributor.email ||
          "unknown@example.com",
        universityId: mappedStudent?.universityId || null,
        commits: [],
      });
    }

    const bucket = merged.get(bucketKey);
    bucket.commits.push(...(contributor.commits || []));
  });

  return finalizeContributors(Array.from(merged.values()), moduleConfig);
};
