
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  passWithNoTests: true,
  testPathIgnorePatterns: ['<rootDir>/src/lib/audit-trail.test.ts'],
};
