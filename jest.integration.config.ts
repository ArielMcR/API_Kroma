import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'test',
    testRegex: '.*\\.e2e-spec\\.ts$',
    transform: { '^.+\\.(t|j)s$': 'ts-jest' },
    moduleNameMapper: { '^src/(.*)$': '<rootDir>/../src/$1' },
    testEnvironment: 'node',
    setupFiles: ['./setup-integration.ts'],
    coverageDirectory: '../coverage/integration',
};

export default config;
