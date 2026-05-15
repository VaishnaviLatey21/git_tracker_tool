const {
  fetchStoredRepositoryContributorsWithIdentity,
} = require("../../src/services/repositoryAnalyticsService");

const makeCommit = ({
  sha,
  authorName,
  authorEmail,
  timestamp = "2026-05-14T12:00:00.000Z",
  qualityScore = 85,
}) => ({
  sha,
  message: "feature update",
  authorName,
  authorEmail,
  timestamp,
  additions: 10,
  deletions: 2,
  branch: "main",
  isLowQuality: qualityScore < 60,
  isGenericMessage: false,
  isSmallCommit: false,
  isWhitespaceOnly: false,
  qualityScore,
});

describe("repositoryAnalyticsService integration", () => {
  test("builds contributors from stored commits and applies identity mapping", async () => {
    const fakePrisma = {
      commit: {
        findMany: jest.fn().mockResolvedValue([
          makeCommit({
            sha: "sha-1",
            authorName: "Vaishnavi S",
            authorEmail: "unknown@example.com",
          }),
          makeCommit({
            sha: "sha-2",
            authorName: "Ethan P",
            authorEmail: "unknown@example.com",
          }),
        ]),
      },
    };

    const students = [
      {
        id: 101,
        name: "Vaishnavi S",
        universityId: "v101",
        identities: [{ gitEmail: "", gitUsername: "vaishnavi" }],
      },
      {
        id: 102,
        name: "Ethan P",
        universityId: "e102",
        identities: [{ gitEmail: "", gitUsername: "ethan" }],
      },
    ];

    const result = await fetchStoredRepositoryContributorsWithIdentity(
      fakePrisma,
      99,
      {
        minExpectedCommits: 1,
        inactivityDays: 7,
      },
      students
    );

    expect(fakePrisma.commit.findMany).toHaveBeenCalledTimes(1);
    expect(result.rawContributors).toHaveLength(2);
    expect(result.mappedContributors).toHaveLength(2);
    expect(
      result.mappedContributors.map((item) => `${item.name}:${item.totalCommits}`)
    ).toEqual(expect.arrayContaining(["Vaishnavi S:1", "Ethan P:1"]));
  });
});
