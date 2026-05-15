const { applyIdentityMappings } = require("../../src/utils/contributorIdentityMapper");

const now = new Date("2026-05-14T10:00:00.000Z").toISOString();

describe("contributorIdentityMapper.applyIdentityMappings", () => {
  test("maps contributors by email/name and keeps distinct students", () => {
    const contributors = [
      {
        name: "Vaishnavi S",
        email: "vaishnavi@uni.ac.uk",
        username: "vaishnavi",
        commits: [{ sha: "a1", timestamp: now, qualityScore: 90 }],
      },
      {
        name: "Ethan P",
        email: "unknown@example.com",
        username: "",
        commits: [{ sha: "b1", timestamp: now, qualityScore: 82 }],
      },
    ];

    const students = [
      {
        id: 11,
        name: "Vaishnavi S",
        universityId: "u11",
        identities: [{ gitEmail: "vaishnavi@uni.ac.uk", gitUsername: "vaishnavi" }],
      },
      {
        id: 12,
        name: "Ethan P",
        universityId: "u12",
        identities: [{ gitEmail: "", gitUsername: "ethanp" }],
      },
    ];

    const mapped = applyIdentityMappings(contributors, students, {
      minExpectedCommits: 1,
      inactivityDays: 7,
    });

    expect(mapped).toHaveLength(2);
    expect(mapped.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Vaishnavi S", "Ethan P"])
    );
    expect(mapped.find((item) => item.name === "Vaishnavi S").totalCommits).toBe(1);
    expect(mapped.find((item) => item.name === "Ethan P").totalCommits).toBe(1);
  });

  test("includes enrolled students with zero commits", () => {
    const contributors = [
      {
        name: "Vaishnavi S",
        email: "vaishnavi@uni.ac.uk",
        username: "vaishnavi",
        commits: [{ sha: "a1", timestamp: now, qualityScore: 90 }],
      },
    ];

    const students = [
      {
        id: 21,
        name: "Vaishnavi S",
        universityId: "u21",
        identities: [{ gitEmail: "vaishnavi@uni.ac.uk", gitUsername: "vaishnavi" }],
      },
      {
        id: 22,
        name: "Maya R",
        universityId: "u22",
        identities: [{ gitEmail: "", gitUsername: "maya-r" }],
      },
    ];

    const mapped = applyIdentityMappings(contributors, students, {
      minExpectedCommits: 1,
      inactivityDays: 7,
    });

    expect(mapped).toHaveLength(2);
    const maya = mapped.find((item) => item.name === "Maya R");
    expect(maya).toBeDefined();
    expect(maya.totalCommits).toBe(0);
  });
});
