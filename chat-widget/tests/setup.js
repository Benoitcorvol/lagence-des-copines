/**
 * Vitest setup file
 * Runs before all tests
 */

import { beforeEach, vi } from 'vitest';

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

global.localStorage = localStorageMock;

// Mock crypto.randomUUID
const randomUUIDMock = vi.fn(() => 'test-uuid-1234-5678-90ab-cdef');

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: randomUUIDMock
  },
  writable: true
});

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  randomUUIDMock.mockClear();
});
