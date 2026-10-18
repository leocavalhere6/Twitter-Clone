const dotenv = require("dotenv");

dotenv.config({
  path: ".env.development",
});

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/tests/e2e/",
  ],
  collectCoverageFrom: [
    "infra/**/*.{js,ts}",
    "models/**/*.{js,ts}",
    "pages/api/**/*.{js,ts}",
    "!**/*.test.{js,ts}",
    "!infra/migrations/**",
    "!infra/scripts/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
});

module.exports = jestConfig;
