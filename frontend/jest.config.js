module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|expo(nent)?|@expo|@unimodules|@react-navigation|react-clone-referenced-element|react-native-svg)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
