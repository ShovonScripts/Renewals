// Test-only setup. jest-expo does not mock AsyncStorage for us, and the store reads and
// writes through it on every hydration.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
