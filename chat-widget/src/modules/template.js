/**
 * HTML template for L'Agence des Copines Chat Widget
 * @module template
 */

import { CONFIG } from './config.js';

/**
 * Get HTML template as a string
 * @returns {string} HTML template
 */
export function getHTML() {
  return `
    <div class="lac-widget-container">
      <!-- Floating Button -->
      <button class="lac-widget-button" aria-label="Ouvrir le chat" title="Besoin d'aide ?">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.28-3.87-.78l-.28-.11-2.91.49.49-2.91-.11-.28C4.78 14.68 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
          <circle cx="8" cy="12" r="1"/>
          <circle cx="12" cy="12" r="1"/>
          <circle cx="16" cy="12" r="1"/>
        </svg>
        <span class="sr-only">Ouvrir le chat</span>
      </button>

      <!-- Chat Popup -->
      <div class="lac-chat-container" role="dialog" aria-labelledby="chat-title" aria-modal="true">
        <!-- Header -->
        <div class="lac-chat-header">
          <h2 id="chat-title" class="lac-chat-title">L'Agence des Copines</h2>
          <div class="lac-header-actions">
            <button class="lac-reset-button" aria-label="Nouvelle conversation" title="Nouvelle conversation">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
            <button class="lac-close-button" aria-label="Fermer le chat" title="Fermer">
              ×
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="lac-messages-area" role="log" aria-live="polite">
          <!-- Messages will be inserted here dynamically -->
        </div>

        <!-- Input Area -->
        <div class="lac-input-area" style="position: relative;">
          <textarea
            class="lac-input-textarea"
            placeholder="Écris ton message..."
            aria-label="Message"
            maxlength="${CONFIG.MAX_MESSAGE_LENGTH}"
            rows="1"
          ></textarea>
          <span class="lac-input-counter">0/${CONFIG.MAX_MESSAGE_LENGTH}</span>
          <button class="lac-send-button" aria-label="Envoyer le message">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  `;
}
