const axios = require("axios");

const API_VERSION_PATH = "/api/v4";

const normalizeBaseUrl = (value = "") => String(value || "").trim().replace(/\/+$/, "");

const toApiBaseUrl = (value = "") => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return "";
  if (normalized.endsWith(API_VERSION_PATH)) return normalized;
  return `${normalized}${API_VERSION_PATH}`;
};

const getConfiguredBaseUrl = () => toApiBaseUrl(process.env.GITLAB_BASE_URL);

const getGitLabToken = (baseUrl = "") => {
  if (String(baseUrl).includes("campus.cs.le.ac.uk")) {
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
    timeout: 30000,
  });
};

const slugifyPath = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63) || "group-project";

const parseErrorMessage = (error) => {
  const payload = error?.response?.data;
  if (!payload) return error?.message || "Unknown error";
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload.message)) return payload.message.join(", ");
  if (typeof payload.message === "string") return payload.message;
  if (payload.message && typeof payload.message === "object") {
    return Object.values(payload.message)
      .flat()
      .map((item) => String(item))
      .join(", ");
  }
  return error?.message || "Unknown error";
};

const resolveNamespaceId = async (client, namespaceId, namespacePath) => {
  if (namespaceId && Number.isFinite(Number(namespaceId))) {
    return Number(namespaceId);
  }

  const path = String(namespacePath || "").trim();
  if (!path) return null;

  const response = await client.get("/namespaces", {
    params: {
      search: path.split("/").pop(),
      per_page: 100,
    },
  });

  const rows = Array.isArray(response.data) ? response.data : [];
  const exact = rows.find(
    (item) => String(item.full_path || "").toLowerCase() === path.toLowerCase()
  );

  return exact?.id || null;
};

const findGitLabUser = async (client, { gitUsername, gitEmail }) => {
  const username = String(gitUsername || "").trim();
  const email = String(gitEmail || "").trim();

  if (username) {
    const byUsername = await client.get("/users", {
      params: {
        username,
        per_page: 20,
      },
    });
    const usernameRows = Array.isArray(byUsername.data) ? byUsername.data : [];
    const exactUsername = usernameRows.find(
      (item) => String(item.username || "").toLowerCase() === username.toLowerCase()
    );
    if (exactUsername) {
      return {
        id: exactUsername.id,
        username: exactUsername.username,
        webUrl: exactUsername.web_url,
      };
    }
  }

  if (email) {
    const searchByEmail = await client.get("/users", {
      params: {
        search: email,
        per_page: 50,
      },
    });
    const emailRows = Array.isArray(searchByEmail.data) ? searchByEmail.data : [];
    const exactEmail = emailRows.find(
      (item) => String(item.public_email || "").toLowerCase() === email.toLowerCase()
    );

    if (exactEmail) {
      return {
        id: exactEmail.id,
        username: exactEmail.username,
        webUrl: exactEmail.web_url,
      };
    }
  }

  return null;
};

const addOrUpdateProjectMember = async (client, projectId, userId, accessLevel) => {
  try {
    await client.post(`/projects/${projectId}/members`, {
      user_id: userId,
      access_level: accessLevel,
    });
    return { status: "assigned" };
  } catch (error) {
    if (error?.response?.status === 409) {
      try {
        const existingResponse = await client.get(
          `/projects/${projectId}/members/all/${userId}`
        );
        const existingAccess = Number(existingResponse.data?.access_level || 0);

        if (existingAccess < accessLevel) {
          await client.put(`/projects/${projectId}/members/${userId}`, {
            access_level: accessLevel,
          });
          return { status: "updated_permission" };
        }

        return { status: "already_member" };
      } catch (_existingError) {
        return { status: "already_member" };
      }
    }

    if (error?.response?.status === 403) {
      return { status: "permission_denied", message: parseErrorMessage(error) };
    }

    return { status: "failed", message: parseErrorMessage(error) };
  }
};

const createGitLabProject = async (
  client,
  { projectName, namespaceId, visibility = "private", initializeWithReadme = true }
) => {
  const payload = {
    name: projectName,
    path: slugifyPath(projectName),
    visibility,
    initialize_with_readme: !!initializeWithReadme,
  };

  if (namespaceId) {
    payload.namespace_id = namespaceId;
  }

  const response = await client.post("/projects", payload);
  return response.data;
};

const deleteGitLabProject = async (client, projectId) => {
  await client.delete(`/projects/${projectId}`);
};

const parseGitLabAccessLevel = (value) => {
  if (Number.isFinite(Number(value))) {
    return Number(value);
  }

  const normalized = String(value || "DEVELOPER").trim().toUpperCase();
  const map = {
    GUEST: 10,
    REPORTER: 20,
    DEVELOPER: 30,
    MAINTAINER: 40,
    OWNER: 50,
  };

  return map[normalized] || 30;
};

module.exports = {
  addOrUpdateProjectMember,
  createGitLabClient,
  createGitLabProject,
  deleteGitLabProject,
  findGitLabUser,
  parseErrorMessage,
  parseGitLabAccessLevel,
  resolveNamespaceId,
};

