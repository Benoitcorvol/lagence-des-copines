/**
 * LocalStorage management for L'Agence des Copines Chat Widget
 * @module storage
 */

import { generateUUID, debug } from './utils.js';
import { CONFIG } from './config.js';

// Storage keys
const KEYS = {
  USER_ID: 'lac_user_id',
  CONVERSATION_ID: 'lac_conversation_id',
  MESSAGES_CACHE: 'lac_messages_cache',
  CACHE_TIMESTAMP: 'lac_cache_timestamp'
};

/**
 * Get or create user ID from localStorage
 * @returns {string} User ID (UUID)
 */
export function getUserId() {
  let userId = localStorage.getItem(KEYS.USER_ID);
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem(KEYS.USER_ID, userId);
    debug('Created new user ID:', userId);
  }
  return userId;
}

/**
 * Get or create conversation ID from localStorage
 * @returns {string} Conversation ID (UUID)
 */
export function getConversationId() {
  let conversationId = localStorage.getItem(KEYS.CONVERSATION_ID);
  if (!conversationId) {
    conversationId = generateUUID();
    localStorage.setItem(KEYS.CONVERSATION_ID, conversationId);
    debug('Created new conversation ID:', conversationId);
  }
  return conversationId;
}

/**
 * Reset conversation (creates a new conversation ID)
 * @returns {string} New conversation ID
 */
export function resetConversation() {
  const conversationId = generateUUID();
  localStorage.setItem(KEYS.CONVERSATION_ID, conversationId);
  localStorage.removeItem(KEYS.MESSAGES_CACHE);
  localStorage.removeItem(KEYS.CACHE_TIMESTAMP);
  debug('Conversation reset with new ID:', conversationId);
  return conversationId;
}

/**
 * Load messages from localStorage cache
 * Returns null if cache is expired or doesn't exist
 * @returns {Array|null} Array of messages or null
 */
export function loadMessagesFromCache() {
  try {
    const cached = localStorage.getItem(KEYS.MESSAGES_CACHE);
    const timestamp = localStorage.getItem(KEYS.CACHE_TIMESTAMP);

    if (!cached || !timestamp) {
      return null;
    }

    const cacheAge = Date.now() - parseInt(timestamp);
    if (cacheAge > CONFIG.CACHE_DURATION) {
      debug('Cache expired (age: ' + Math.round(cacheAge / 1000) + 's)');
      return null;
    }

    debug('Cache hit (age: ' + Math.round(cacheAge / 1000) + 's)');
    return JSON.parse(cached);
  } catch (error) {
    debug('Error loading cache:', error);
    return null;
  }
}

/**
 * Save messages to localStorage cache
 * @param {Array} messages - Array of message objects
 */
export function saveMessagesToCache(messages) {
  try {
    localStorage.setItem(KEYS.MESSAGES_CACHE, JSON.stringify(messages));
    localStorage.setItem(KEYS.CACHE_TIMESTAMP, Date.now().toString());
    debug('Messages saved to cache:', messages.length);
  } catch (error) {
    debug('Error saving cache:', error);
  }
}

/**
 * Clear all widget data from localStorage
 */
export function clearAllData() {
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  debug('All widget data cleared from localStorage');
}
