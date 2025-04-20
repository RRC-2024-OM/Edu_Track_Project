/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },

  // Where to find test files
  testMatch: ['**/test/**/*.test.ts'],

  // Improve error messaging
  verbose: true,
  reporters: ['default', 'jest-summary-reporter'],

  // Collect coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/config/env.ts',
    '!src/config/swagger.ts', // optional to exclude Swagger config
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],

  // Optional: Fail build if coverage is too low
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Ignore folders like scripts, build artifacts, coverage reports
  testPathIgnorePatterns: [
    '/node_modules/',
    '/scripts/',
    '/coverage/',
    '/dist/',
  ],
};
