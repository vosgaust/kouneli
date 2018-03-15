module.exports = {
  cacheDirectory: './node_modules/.cache/jest',
  collectCoverageFrom: [
    '**/*.{js}',
    '!jest.config.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: './node_modules/.cache/jestCoverage',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/test/**/?(*.)(spec|test).js'
  ],
  verbose: true,
};
