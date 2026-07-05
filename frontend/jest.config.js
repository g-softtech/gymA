/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        types: ["jest", "node"],
        moduleResolution: "node",
        module: "commonjs",
        jsx: "react",
        esModuleInterop: true,
      },
    }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
  // These files use Vitest (vi.mock, vi.fn) and cannot run under Jest
  testPathIgnorePatterns: [
    "/node_modules/",
    "tests/dashboard-routing.test.tsx",
    "tests/notification-service.test.ts",
  ],
};

module.exports = config;
