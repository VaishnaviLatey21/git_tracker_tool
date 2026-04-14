const GENERIC_MESSAGES = [
  "update",
  "fix",
  "changes",
  "minor changes",
  "final",
  "work",
  "test",
  "commit",
  "done"
];

exports.analyzeCommitQuality = ({
  message,
  additions,
  deletions,
  patch,
  config
}) => {
  const lowerMessage = message.toLowerCase().trim();

  // Generic Message Detection
  const isGenericMessage = GENERIC_MESSAGES.some(keyword =>
    lowerMessage === keyword || lowerMessage.startsWith(keyword)
  );

  // Very Small Commit Detection
  const totalChanges = additions + deletions;
  const isSmallCommit = totalChanges < (config?.smallCommitThreshold || 5);

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