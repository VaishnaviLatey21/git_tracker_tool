const GENERIC_MESSAGES = [
  "update",
  "fix",
  "changes",
  "minor changes",
  "final",
  "work",
  "test",
  "commit",
  "done",
  "wip",
  "misc",
  "temp",
  "try",
  "testing",
  "bug fix",
  "small fix",
  "quick fix",
  "minor fix",
  "minor update",
  "small update",
  "quick update",
  "updates",
  "latest changes",
  "new changes",
  "code changes",
  "stuff",
  "improvements",
  "improvement",
  "final changes",
  "final update",
  "last update",
  "last commit",
  "final commit",
  "another commit",
  "commit changes",
  "commit update",
  "more changes",
  "more updates",
  "some changes",
  "some updates",
  "edit",
  "edited",
  "modify",
  "modified",
  "modifications",
  "patch",
  "hotfix",
  "cleanup",
  "clean up",
  "refactor",
  "rework",
  "sync",
  "sync changes",
  "merge",
  "merge changes",
  "resolved",
  "resolve conflict",
  "resolve conflicts",
  "fix conflict",
  "fixed conflict",
  "typo",
  "typo fix",
  "format",
  "formatting",
  "style",
  "whitespace",
  "lint",
  "build",
  "build fix",
  "ci fix",
  "pipeline fix",
  "docs",
  "doc update",
  "documentation update",
  "readme update",
  "initial",
  "initial commit",
  "start",
  "project setup",
  "setup",
  "test commit",
  "testing commit",
  "dummy commit",
  "trial",
  "checkpoint",
  "progress",
  "work in progress",
  "push",
  "upload",
  "save",
  "saved",
  "final submit"
];

exports.analyzeCommitQuality = ({
  message,
  additions,
  deletions,
  patch,
  config
}) => {
  const lowerMessage = String(message || "").toLowerCase().trim();
  const normalizedMessage = lowerMessage.replace(/\s+/g, " ");
  const smallCommitThreshold = Number.isFinite(Number(config?.smallCommitThreshold))
    ? Math.max(0, Number(config?.smallCommitThreshold))
    : 5;

  // Generic Message Detection
  const isGenericMessage = GENERIC_MESSAGES.some((keyword) => {
    if (normalizedMessage === keyword) return true;

    return (
      normalizedMessage.startsWith(`${keyword} `) ||
      normalizedMessage.startsWith(`${keyword}:`) ||
      normalizedMessage.startsWith(`${keyword}-`) ||
      normalizedMessage.startsWith(`${keyword}.`)
    );
  });

  // Very Small Commit Detection
  const totalChanges = Number(additions || 0) + Number(deletions || 0);
  const isSmallCommit = totalChanges < smallCommitThreshold;

  // Whitespace Only Detection
  const isWhitespaceOnly =
    patch && patch.replace(/\s/g, "").length === 0;

  // Quality Score (0–100)
  let qualityScore = 100;
  if (isGenericMessage) qualityScore -= 30;
  if (isSmallCommit) qualityScore -= 20;
  if (isWhitespaceOnly) qualityScore -= 50;

  return {
    isGenericMessage,
    isSmallCommit,
    isWhitespaceOnly,
    qualityScore: Math.max(qualityScore, 0),
  };
};
