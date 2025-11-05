/**
 * Utility functions for L'Agence des Copines Chat Widget
 * @module utils
 */

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID() if available, fallback to manual generation
 * @returns {string} UUID v4 string
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Debug logging utility (only logs when lac_debug is set in localStorage)
 * @param {...any} args - Arguments to log
 */
export function debug(...args) {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('lac_debug') === 'true') {
    console.log('[LAC Widget]', new Date().toISOString(), ...args);
  }
}

/**
 * Sleep utility for async delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format time in French locale (HH:MM)
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
export function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} HTML-safe text
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get a random item from an array
 * @template T
 * @param {T[]} array - Array to pick from
 * @returns {T} Random item
 */
export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
