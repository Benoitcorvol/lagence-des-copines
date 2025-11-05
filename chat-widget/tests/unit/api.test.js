/**
 * Unit tests for api module
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sendMessageToAPI, getErrorType } from '../../src/modules/api.js';

describe('api', () => {
  let fetchMock;

  beforeEach(() => {
    // Create fetch mock
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendMessageToAPI', () => {
    it('should send message successfully and return response', async () => {
      const mockResponse = {
        response: 'Hello!',
        timestamp: '2025-01-01T00:00:00Z',
        agentType: 'creation'
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_user_id') return 'user-123';
        if (key === 'lac_conversation_id') return 'conv-456';
        return null;
      });

      const result = await sendMessageToAPI('Test message');

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://chat.lagencedescopines.com/webhook/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test message')
        })
      );
    });

    it.skip('should throw RATE_LIMIT error on 429 status', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_user_id') return 'user-123';
        if (key === 'lac_conversation_id') return 'conv-456';
        return null;
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await expect(sendMessageToAPI('Test')).rejects.toThrow('RATE_LIMIT');
    });

    it.skip('should throw API_ERROR on non-ok response', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_user_id') return 'user-123';
        if (key === 'lac_conversation_id') return 'conv-456';
        return null;
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(sendMessageToAPI('Test')).rejects.toThrow('API_ERROR');
    });

    it.skip('should throw error if response contains error field', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_user_id') return 'user-123';
        if (key === 'lac_conversation_id') return 'conv-456';
        return null;
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: true, code: 'CUSTOM_ERROR' })
      });

      await expect(sendMessageToAPI('Test')).rejects.toThrow('CUSTOM_ERROR');
    });

    it('should retry once on failure', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_user_id') return 'user-123';
        if (key === 'lac_conversation_id') return 'conv-456';
        return null;
      });

      // First call fails
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // Second call succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Success after retry' })
      });

      const result = await sendMessageToAPI('Test');

      expect(result.response).toBe('Success after retry');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should not retry on AbortError (timeout)', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_user_id') return 'user-123';
        if (key === 'lac_conversation_id') return 'conv-456';
        return null;
      });

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      fetchMock.mockRejectedValueOnce(abortError);

      await expect(sendMessageToAPI('Test')).rejects.toThrow('Aborted');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not retry more than once', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'lac_user_id') return 'user-123';
        if (key === 'lac_conversation_id') return 'conv-456';
        return null;
      });

      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(sendMessageToAPI('Test')).rejects.toThrow('Network error');
      expect(fetchMock).toHaveBeenCalledTimes(2); // Original + 1 retry
    });
  });

  describe('getErrorType', () => {
    it('should return TIMEOUT for AbortError', () => {
      const error = new Error('Timeout');
      error.name = 'AbortError';

      expect(getErrorType(error)).toBe('TIMEOUT');
    });

    it('should return RATE_LIMIT for RATE_LIMIT message', () => {
      const error = new Error('RATE_LIMIT');

      expect(getErrorType(error)).toBe('RATE_LIMIT');
    });

    it('should return NETWORK_ERROR for fetch errors', () => {
      const error = new Error('fetch failed');

      expect(getErrorType(error)).toBe('NETWORK_ERROR');
    });

    it('should return NETWORK_ERROR for network errors', () => {
      const error = new Error('network timeout');

      expect(getErrorType(error)).toBe('NETWORK_ERROR');
    });

    it('should return SERVICE_ERROR for unknown errors', () => {
      const error = new Error('Something went wrong');

      expect(getErrorType(error)).toBe('SERVICE_ERROR');
    });
  });
});
