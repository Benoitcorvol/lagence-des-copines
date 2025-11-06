/**
 * Unit tests for utils module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUUID, debug, sleep, formatTime, escapeHtml, getRandomItem } from '../../src/modules/utils.js';

describe('utils', () => {
  describe('generateUUID', () => {
    it('should generate a UUID using crypto.randomUUID if available', () => {
      const uuid = generateUUID();
      expect(uuid).toBe('test-uuid-1234-5678-90ab-cdef');
    });

    it('should generate a valid UUID format when crypto is not available', () => {
      const originalCrypto = global.crypto;
      global.crypto = undefined;

      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

      global.crypto = originalCrypto;
    });
  });

  describe('debug', () => {
    let consoleLogSpy;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should log when lac_debug is true', () => {
      localStorage.getItem.mockReturnValue('true');

      debug('test message', 123);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toBe('[LAC Widget]');
      expect(consoleLogSpy.mock.calls[0][2]).toBe('test message');
      expect(consoleLogSpy.mock.calls[0][3]).toBe(123);
    });

    it('should not log when lac_debug is false', () => {
      localStorage.getItem.mockReturnValue('false');

      debug('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log when lac_debug is not set', () => {
      localStorage.getItem.mockReturnValue(null);

      debug('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      // Allow for slight timing variations in CI environments
      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('formatTime', () => {
    it('should format time in French locale (HH:MM)', () => {
      const date = new Date('2025-01-15T14:30:00');
      const formatted = formatTime(date);

      expect(formatted).toMatch(/14:30/);
    });

    it('should handle midnight correctly', () => {
      const date = new Date('2025-01-15T00:00:00');
      const formatted = formatTime(date);

      expect(formatted).toMatch(/00:00/);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(input);

      expect(escaped).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const escaped = escapeHtml(input);

      expect(escaped).toBe('Tom &amp; Jerry');
    });

    it('should handle quotes', () => {
      const input = 'Say "Hello"';
      const escaped = escapeHtml(input);

      expect(escaped).toBe('Say "Hello"');
    });

    it('should return empty string for empty input', () => {
      const escaped = escapeHtml('');
      expect(escaped).toBe('');
    });

    it('should handle plain text without changes', () => {
      const input = 'Hello World';
      const escaped = escapeHtml(input);

      expect(escaped).toBe('Hello World');
    });
  });

  describe('getRandomItem', () => {
    it('should return an item from the array', () => {
      const array = ['a', 'b', 'c'];
      const item = getRandomItem(array);

      expect(array).toContain(item);
    });

    it('should return the only item in a single-item array', () => {
      const array = ['only'];
      const item = getRandomItem(array);

      expect(item).toBe('only');
    });

    it('should work with different data types', () => {
      const array = [1, 'two', { three: 3 }, null];
      const item = getRandomItem(array);

      expect(array).toContain(item);
    });
  });
});
