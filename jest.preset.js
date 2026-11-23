const nxPreset = require('@nx/jest/preset').default

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    '\\.svg': '<rootDir>../../testing/svgrMock.js',
    '\\.css$': '<rootDir>../../testing/imgMock.js',
    '\\.(woff2?|ttf|otf|eot)$': '<rootDir>../../testing/imgMock.js',
    '^inter-ui$': '<rootDir>../../testing/imgMock.js',
    'cow-react$': '<rootDir>../../testing/cowReactMock.js',
    '\\.gif': '<rootDir>../../testing/imgMock.js',
    '\\.webp': '<rootDir>../../testing/imgMock.js',
    '\\.png': '<rootDir>../../testing/imgMock.js',
  },
}
