const { parseRepositoryUrl } = require("../../src/utils/repoParser");

describe("repoParser.parseRepositoryUrl", () => {
  test("parses https URL with subgroup path and trims suffixes", () => {
    const parsed = parseRepositoryUrl(
      "https://gitlab.com/school/soa/team-alpha.git?ref=main#readme"
    );

    expect(parsed).toEqual({
      baseUrl: "https://gitlab.com",
      owner: "school/soa",
      repo: "team-alpha",
    });
  });

  test("parses SSH URL", () => {
    const parsed = parseRepositoryUrl("git@gitlab.com:org/subgroup/repo-one.git");

    expect(parsed).toEqual({
      baseUrl: "https://gitlab.com",
      owner: "org/subgroup",
      repo: "repo-one",
    });
  });

  test("throws for invalid URL", () => {
    expect(() => parseRepositoryUrl("not-a-valid-url")).toThrow(
      "Invalid repository URL format"
    );
  });
});
