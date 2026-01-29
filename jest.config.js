module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js', '**/*.property.test.js'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
