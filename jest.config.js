module.exports = {
    testEnvironment: "node",
    testTimeout: 100000,
    coverageProvider: 'v8',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: '<rootDir>/artifacts/coverage',
    coverageReporters: [
        'html',
        'text',
        'lcov',
        'cobertura'
    ],
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: "artifacts/test",
            outputName: "xunit.xml",
            usePathForSuiteName: true
        }]],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    }
};

