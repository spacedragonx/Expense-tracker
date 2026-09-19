import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: { strict: false } }],
  },
  // Prevent ts-jest from type-checking test files (speed up)
  globals: {},
};

export default config;
