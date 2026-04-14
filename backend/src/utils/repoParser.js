const sanitize = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "");

const parseSshRepositoryUrl = (value) => {
  const sshMatch = value.match(/^git@([^:]+):(.+)$/i);
  if (!sshMatch) return null;

  const host = sshMatch[1];
  const path = sanitize(sshMatch[2]);
  const pathParts = path.split("/").filter(Boolean);
  const repo = pathParts.pop();
  const owner = pathParts.join("/");

  if (!host || !repo || !owner) {
    throw new Error("Invalid repository URL format");
  }

  return {
    baseUrl: `https://${host}`,
    owner,
    repo,
  };
};

exports.parseRepositoryUrl = (url) => {
  const rawUrl = sanitize(url);
  if (!rawUrl) {
    throw new Error("Repository URL is required");
  }

  const sshParsed = parseSshRepositoryUrl(rawUrl);
  if (sshParsed) return sshParsed;

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_error) {
    throw new Error("Invalid repository URL format");
  }

  const host = `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, "");
  const pathParts = parsed.pathname.split("/").filter(Boolean);
  const repo = pathParts.pop();
  const owner = pathParts.join("/");

  if (!repo || !owner) {
    throw new Error("Repository URL must include owner and repository name");
  }

  return {
    baseUrl: host,
    owner,
    repo,
  };
};
