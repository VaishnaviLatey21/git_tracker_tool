module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  clearMocks: true,
  verbose: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
  ],
};
