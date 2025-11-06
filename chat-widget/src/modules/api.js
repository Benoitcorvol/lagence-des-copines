/**
 * API communication module for L'Agence des Copines Chat Widget
 * @module api
 */

import { CONFIG } from './config.js';
import { debug, sleep } from './utils.js';
import { getUserId, getConversationId } from './storage.js';

/**
 * Send a message to the chat API
 * @param {string} message - User message to send
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Object>} API response data
 * @throws {Error} Various error types (RATE_LIMIT, TIMEOUT, API_ERROR, etc.)
 */
export async function sendMessageToAPI(message, retryCount = 0) {
  debug('Sending message to API:', message, 'retry:', retryCount);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId: getConversationId(),
        userId: getUserId(),
        message: message,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      throw new Error('API_ERROR');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.code || 'UNKNOWN_ERROR');
    }

    debug('Message sent successfully:', data);
    return data;

  } catch (error) {
    debug('Error sending message:', error);

    // Auto-retry once (silent) for non-timeout errors
    if (retryCount < CONFIG.MAX_RETRY && error.name !== 'AbortError') {
      debug('Auto-retry attempt:', retryCount + 1);
      await sleep(2000);
      return sendMessageToAPI(message, retryCount + 1);
    }

    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * Determine error type from caught error
 * @param {Error} error - The error object
 * @returns {string} Error type key (for ERROR_MESSAGES)
 */
export function getErrorType(error) {
  if (error.name === 'AbortError') {
    return 'TIMEOUT';
  } else if (error.message === 'RATE_LIMIT') {
    return 'RATE_LIMIT';
  } else if (error.message.includes('fetch') || error.message.includes('network')) {
    return 'NETWORK_ERROR';
  }
  return 'SERVICE_ERROR';
}
