// const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
// const { jsWithTs: tsjPreset } = require('ts-jest/presets');
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const { compilerOptions } = require('./tsconfig');

const localPathMapper = {
  ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  // '^@public/(.*?)(\\?.*)?$': '<rootDir>/public/$1',
  // '^@images/(.*?)(\\?.*)?$': '<rootDir>/public/images/$1',

  // '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|css|scss|sass|less)(\\?.*)?$':
  //   '<rootDir>/apps/portal/__mocks__/fileMock.js',
};
// console.log(tsjPreset.transform);

module.exports = {
  testTimeout: 180000,
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: localPathMapper,
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        // tsconfig: 'tsconfig.jest.json',
        // Disable type-checking
        isolatedModules: true,
      },
    ],
    // '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)(\\?.*)?$':
    //   'jest-transform-stub',
    // '^.+\\.svg$': 'jest-svg-transformer',
  },
  // transformIgnorePatterns: ['node_modules/(?!(simple-git/src))/'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    '<rootDir>/.git/',
    '<rootDir>/coverage',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/static/',
    '<rootDir>/templates/',
    '<rootDir>/test/',
    '<rootDir>/upload/',
  ],
};
