import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: { '^.+\\.(t|j)s$': 'ts-jest' },
    moduleNameMapper: { '^src/(.*)$': '<rootDir>/$1' },
    collectCoverageFrom: ['**/useCases/*.ts', '**/domain/*.ts'],
    coverageDirectory: '../coverage/unit',
    testEnvironment: 'node',
};

export default config;
