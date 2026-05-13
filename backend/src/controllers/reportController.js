const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
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

const generateReportData = async (groupId, convenorId, forceRefresh = false) => {
  const group = await prisma.group.findFirst({
    where: {
      id: parseInt(groupId, 10),
      module: {
        convenorId,
      },
    },
    include: {
      module: true,
      repo: true,
      students: {
        include: {
          identities: true,
        },
      },
    },
  });

  if (!group || !group.repo) {
    throw new Error("Repository not found");
  }

  const moduleConfig = extractModuleConfig(group.module);
  const students = group.students || [];

  const storedCommitCount = await prisma.commit.count({
    where: { repositoryId: group.repo.id },
  });

  let mappedContributors = [];

  const shouldRefresh = await shouldRefreshFromRemote(
    group.repo,
    storedCommitCount,
    forceRefresh
  );

  if (storedCommitCount > 0 && !shouldRefresh) {
    ({ mappedContributors } = await fetchStoredRepositoryContributorsWithIdentity(
      prisma,
      group.repo.id,
      moduleConfig,
      students
    ));
  } else {
    const live = await fetchRepositoryContributorsWithIdentity(
      group.repo,
      moduleConfig,
      students
    );
    mappedContributors = live.mappedContributors;

    await persistContributorCommits(prisma, group.repo.id, live.rawContributors);
    await prisma.repository.update({
      where: { id: group.repo.id },
      data: {
        lastSyncedAt: new Date(),
        totalCommits: live.rawContributors.reduce(
          (sum, contributor) => sum + Number(contributor.totalCommits || 0),
          0
        ),
      },
    });
  }

  const totalCommits = mappedContributors.reduce(
    (sum, contributor) => sum + (contributor.totalCommits || 0),
    0
  );

  return {
    groupName: group.name,
    moduleName: group.module.name,
    thresholds: {
      minExpectedCommits: moduleConfig.minExpectedCommits,
      inactivityDays: moduleConfig.inactivityDays,
      smallCommitThreshold: moduleConfig.smallCommitThreshold,
    },
    totalCommits,
    students: mappedContributors.map((contributor) => ({
      name: contributor.name,
      universityId: contributor.universityId || "",
      email: contributor.email,
      totalCommits: contributor.totalCommits,
      contributionPercentage: contributor.contributionPercentage,
      lowQualityCommits: contributor.lowQualityCommits,
      inactivityGapCount: contributor.inactivityGaps?.length || 0,
      inactivityFlag: (contributor.inactivityGaps?.length || 0) > 0,
      belowExpectedCommits: !!contributor.belowExpectedCommits,
      expectedCommitsTarget:
        contributor.expectedCommitsTarget ?? moduleConfig.minExpectedCommits,
      deadlineSpike: !!contributor.deadlineSpike,
    })),
  };
};

exports.generateGroupReport = async (req, res) => {
  try {
    const forceRefresh =
      String(req.query.refresh || "").toLowerCase() === "true" ||
      String(req.query.refresh || "") === "1";

    const report = await generateReportData(
      req.params.groupId,
      req.user.id,
      forceRefresh
    );
    res.json(report);
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

exports.exportGroupReportCSV = async (req, res) => {
  try {
    const { groupId } = req.params;
    const report = await generateReportData(groupId, req.user.id);

    const parser = new Parser();
    const csv = parser.parse(report.students);

    res.header("Content-Type", "text/csv");
    res.attachment(`group-${groupId}-report.csv`);
    res.send(csv);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(500).json({ message: "CSV export failed" });
  }
};

exports.exportGroupReportPDF = async (req, res) => {
  try {
    const { groupId } = req.params;
    const report = await generateReportData(groupId, req.user.id);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=group-${groupId}-report.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("Group Summary Report", { underline: true });
    doc.moveDown();

    doc.text(`Module: ${report.moduleName}`);
    doc.text(`Group: ${report.groupName}`);
    doc.text(`Total Commits: ${report.totalCommits}`);
    doc.text(
      `Thresholds - Min Commits: ${report.thresholds.minExpectedCommits}, Inactivity: ${report.thresholds.inactivityDays} days, Small Commit: < ${report.thresholds.smallCommitThreshold} lines`
    );
    doc.moveDown();

    report.students.forEach((student) => {
      doc.fontSize(12).text(`Name: ${student.name}`);
      if (student.universityId) {
        doc.text(`University ID: ${student.universityId}`);
      }
      doc.text(`Email: ${student.email}`);
      doc.text(`Commits: ${student.totalCommits}`);
      doc.text(`Contribution: ${student.contributionPercentage}%`);
      doc.text(`Low Quality Commits: ${student.lowQualityCommits}`);
      doc.text(`Inactivity Gaps: ${student.inactivityGapCount}`);
      doc.text(`Inactivity Flag: ${student.inactivityFlag ? "Yes" : "No"}`);
      doc.text(
        `Below Expected (${student.expectedCommitsTarget}): ${student.belowExpectedCommits ? "Yes" : "No"}`
      );
      doc.text(`Deadline Spike: ${student.deadlineSpike}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({ message: "PDF export failed" });
  }
};
