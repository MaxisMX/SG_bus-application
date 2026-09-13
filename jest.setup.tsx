/**
 * Test environment setup.
 *
 * Native modules have no JavaScript implementation outside a device, so
 * they are replaced with minimal stand-ins. Icons are mocked separately
 * in __mocks__/@expo/vector-icons.js, which Jest applies automatically.
 *
 * Each mock is deliberately thin: enough for components to render and
 * for behaviour to be asserted, without pretending to reproduce native
 * behaviour.
 */

// In-memory replacement for device storage. Reset between tests so
// nothing leaks from one case to the next.
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      for (const key of keys) delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
    __reset: () => {
      store = {};
    },
  };
});

// Location is granted by default with a fixed position in Singapore, so
// distance calculations in tests are predictable.
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 1.29684825, longitude: 103.85253591 },
    })
  ),
  Accuracy: { Balanced: 3 },
}));
