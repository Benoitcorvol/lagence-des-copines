/**
 * Unit tests for storage module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserId,
  getConversationId,
  resetConversation,
  loadMessagesFromCache,
  saveMessagesToCache,
  clearAllData
} from '../../src/modules/storage.js';

describe('storage', () => {
  beforeEach(() => {
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
  });

  describe('getUserId', () => {
    it('should return existing user ID from localStorage', () => {
      localStorage.getItem.mockReturnValue('existing-user-id');

      const userId = getUserId();

      expect(userId).toBe('existing-user-id');
      expect(localStorage.getItem).toHaveBeenCalledWith('lac_user_id');
    });

    it('should create and store new user ID if not exists', () => {
      localStorage.getItem.mockReturnValue(null);

      const userId = getUserId();

      expect(userId).toBe('test-uuid-1234-5678-90ab-cdef');
      expect(localStorage.setItem).toHaveBeenCalledWith('lac_user_id', 'test-uuid-1234-5678-90ab-cdef');
    });
  });

  describe('getConversationId', () => {
    it('should return existing conversation ID from localStorage', () => {
      localStorage.getItem.mockReturnValue('existing-conversation-id');

      const conversationId = getConversationId();

      expect(conversationId).toBe('existing-conversation-id');
      expect(localStorage.getItem).toHaveBeenCalledWith('lac_conversation_id');
    });

    it('should create and store new conversation ID if not exists', () => {
      localStorage.getItem.mockReturnValue(null);

      const conversationId = getConversationId();

      expect(conversationId).toBe('test-uuid-1234-5678-90ab-cdef');
      expect(localStorage.setItem).toHaveBeenCalledWith('lac_conversation_id', 'test-uuid-1234-5678-90ab-cdef');
    });
  });

  describe('resetConversation', () => {
    it('should create new conversation ID and clear cache', () => {
      const newId = resetConversation();

      expect(newId).toBe('test-uuid-1234-5678-90ab-cdef');
      expect(localStorage.setItem).toHaveBeenCalledWith('lac_conversation_id', 'test-uuid-1234-5678-90ab-cdef');
      expect(localStorage.removeItem).toHaveBeenCalledWith('lac_messages_cache');
      expect(localStorage.removeItem).toHaveBeenCalledWith('lac_cache_timestamp');
    });
  });

  describe('loadMessagesFromCache', () => {
    it('should return cached messages if cache is valid', () => {
      const messages = [
        { role: 'user', content: 'Hello', timestamp: '2025-01-01T00:00:00Z' },
        { role: 'assistant', content: 'Hi!', timestamp: '2025-01-01T00:00:01Z' }
      ];
      const now = Date.now();

      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_messages_cache') return JSON.stringify(messages);
        if (key === 'lac_cache_timestamp') return String(now - 60000); // 1 minute ago
        return null;
      });

      const loaded = loadMessagesFromCache();

      expect(loaded).toEqual(messages);
    });

    it('should return null if cache is expired', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const now = Date.now();

      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_messages_cache') return JSON.stringify(messages);
        if (key === 'lac_cache_timestamp') return String(now - 6 * 60 * 1000); // 6 minutes ago (expired)
        return null;
      });

      const loaded = loadMessagesFromCache();

      expect(loaded).toBeNull();
    });

    it('should return null if no cache exists', () => {
      localStorage.getItem.mockReturnValue(null);

      const loaded = loadMessagesFromCache();

      expect(loaded).toBeNull();
    });

    it('should return null if cache is corrupted', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_messages_cache') return 'invalid json{';
        if (key === 'lac_cache_timestamp') return String(Date.now());
        return null;
      });

      const loaded = loadMessagesFromCache();

      expect(loaded).toBeNull();
    });
  });

  describe('saveMessagesToCache', () => {
    it('should save messages and timestamp to localStorage', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      saveMessagesToCache(messages);

      expect(localStorage.setItem).toHaveBeenCalledWith('lac_messages_cache', JSON.stringify(messages));
      expect(localStorage.setItem).toHaveBeenCalledWith('lac_cache_timestamp', expect.any(String));
    });

    it('should handle empty array', () => {
      saveMessagesToCache([]);

      expect(localStorage.setItem).toHaveBeenCalledWith('lac_messages_cache', '[]');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveMessagesToCache([{ role: 'user', content: 'Test' }])).not.toThrow();
    });
  });

  describe('clearAllData', () => {
    it('should remove all widget data from localStorage', () => {
      clearAllData();

      expect(localStorage.removeItem).toHaveBeenCalledWith('lac_user_id');
      expect(localStorage.removeItem).toHaveBeenCalledWith('lac_conversation_id');
      expect(localStorage.removeItem).toHaveBeenCalledWith('lac_messages_cache');
      expect(localStorage.removeItem).toHaveBeenCalledWith('lac_cache_timestamp');
    });
  });
});
