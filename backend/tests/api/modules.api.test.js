const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

jest.mock("../../src/controllers/moduleController", () => ({
  createModule: jest.fn((req, res) => res.status(201).json({ ok: true })),
  getModules: jest.fn((req, res) =>
    res.status(200).json([{ id: 1, name: "BDA", year: "2025-26" }])
  ),
  getAllModules: jest.fn((req, res) =>
    res.status(200).json([{ id: 1, name: "BDA", year: "2025-26" }])
  ),
  getOverview: jest.fn((req, res) =>
    res.status(200).json({
      totalModules: 1,
      totalGroups: 2,
      repositories: 2,
      flaggedStudents: 0,
      activeStudents: 2,
    })
  ),
  updateModule: jest.fn((req, res) => res.status(200).json({ updated: true })),
  deleteModule: jest.fn((req, res) => res.status(200).json({ deleted: true })),
}));

jest.mock("../../src/controllers/provisioningController", () => ({
  autoCreateGroupsAndProvisionGitLab: jest.fn((req, res) =>
    res.status(201).json({ message: "provisioned" })
  ),
}));

const moduleController = require("../../src/controllers/moduleController");
const app = require("../../src/app");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

describe("API /api/modules", () => {
  test("returns 401 when token is missing", async () => {
    const response = await request(app).get("/api/modules");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  test("returns 401 for invalid token", async () => {
    const response = await request(app)
      .get("/api/modules")
      .set("Authorization", "Bearer invalid.token.here");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token");
  });

  test("returns 403 for wrong role", async () => {
    const adminToken = signToken({ id: 10, role: "ADMIN" });

    const response = await request(app)
      .get("/api/modules")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("returns module list for convenor role", async () => {
    const convenorToken = signToken({ id: 1, role: "CONVENOR" });

    const response = await request(app)
      .get("/api/modules")
      .set("Authorization", `Bearer ${convenorToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: "BDA", year: "2025-26" }]);
    expect(moduleController.getModules).toHaveBeenCalledTimes(1);
  });
});
