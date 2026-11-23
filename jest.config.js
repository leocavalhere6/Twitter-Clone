const dotenv = require("dotenv");

dotenv.config({
  path: ".env.development",
});

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});

const customJestConfig = {
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
    "src/**/*.ts",
    "!**/*.test.{js,ts}",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!infra/migrations/**",
    "!infra/scripts/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
};

module.exports = async () => {
  const jestConfig = await createJestConfig(customJestConfig)();

  jestConfig.transformIgnorePatterns = [
    "/node_modules/(?!(@nestjs|rxjs)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];

  return jestConfig;
};
