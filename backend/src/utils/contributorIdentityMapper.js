const { analyzeCommitPatterns } = require("./commitPatternAnalyzer");

const normalize = (value) => (value || "").trim().toLowerCase();
const normalizeName = (value) =>
  normalize(value)
    .replace(/\s+/g, " ")
    .trim();

const getStudentPrimaryIdentity = (student) =>
  (student?.identities || []).find(
    (identity) => normalize(identity?.gitEmail) || normalize(identity?.gitUsername)
  ) || null;

const hasReliableEmail = (value) => {
  const email = normalize(value);
  if (!email) return false;
  if (email === "unknown@example.com") return false;
  if (email.includes("no-reply") || email.includes("noreply")) return false;
  return email.includes("@");
};

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
      inactivityFlag: (patterns.inactivityGaps || []).length > 0,
      belowExpectedCommits: !!patterns.belowExpectedCommits,
      expectedCommitsTarget: patterns.expectedCommitsTarget,
      actualCommits: patterns.actualCommits,
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
  const nameToStudent = new Map();

  students.forEach((student) => {
    const studentNameKey = normalizeName(student.name);
    if (studentNameKey && !nameToStudent.has(studentNameKey)) {
      nameToStudent.set(studentNameKey, student);
    }

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
    const contributorName = normalizeName(contributor.name);

    const mappedStudent =
      emailToStudent.get(contributorEmail) ||
      usernameToStudent.get(contributorUsername) ||
      nameToStudent.get(contributorName);

    const bucketKey = mappedStudent
      ? `student:${mappedStudent.id}`
      : `raw:${contributorEmail}|${contributorUsername}|${contributorName || "unknown"}`;

    if (!merged.has(bucketKey)) {
      const primaryIdentity = mappedStudent
        ? getStudentPrimaryIdentity(mappedStudent)
        : null;
      const fallbackStudentEmail = mappedStudent
        ? primaryIdentity?.gitUsername
          ? `${normalize(primaryIdentity.gitUsername) || `student-${mappedStudent.id}`}@identity.local`
          : `student-${mappedStudent.id}@unmapped.local`
        : "unknown@example.com";

      merged.set(bucketKey, {
        name: mappedStudent?.name || contributor.name || "Unknown",
        email:
          primaryIdentity?.gitEmail ||
          (hasReliableEmail(contributor.email)
            ? contributor.email
            : fallbackStudentEmail),
        universityId: mappedStudent?.universityId || null,
        commits: [],
      });
    }

    const bucket = merged.get(bucketKey);
    bucket.commits.push(...(contributor.commits || []));
  });

  students.forEach((student) => {
    const bucketKey = `student:${student.id}`;
    if (merged.has(bucketKey)) return;

    const primaryIdentity = getStudentPrimaryIdentity(student);
    merged.set(bucketKey, {
      name: student.name || "Unknown",
      email: primaryIdentity?.gitEmail || `student-${student.id}@unmapped.local`,
      universityId: student.universityId || null,
      commits: [],
    });
  });

  return finalizeContributors(Array.from(merged.values()), moduleConfig);
};
