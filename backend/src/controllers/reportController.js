const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const {
  fetchRepositoryContributorsWithIdentity,
  fetchStoredRepositoryContributorsWithIdentity,
  persistContributorCommits,
} = require("../services/repositoryAnalyticsService");

const extractModuleConfig = (module) => ({
  inactivityDays: module?.inactivityDays || 7,
  minExpectedCommits: module?.minExpectedCommits || 3,
  smallCommitThreshold: module?.smallCommitThreshold || 5,
});

const generateReportData = async (groupId, convenorId) => {
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

  if (storedCommitCount > 0) {
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
      deadlineSpike: !!contributor.deadlineSpike,
    })),
  };
};

exports.generateGroupReport = async (req, res) => {
  try {
    const report = await generateReportData(req.params.groupId, req.user.id);
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
      doc.text(`Deadline Spike: ${student.deadlineSpike}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({ message: "PDF export failed" });
  }
};
