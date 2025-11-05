/**
 * CSS styles for L'Agence des Copines Chat Widget
 * @module styles
 */

import { CONFIG } from './config.js';

/**
 * Get CSS styles as a string for Shadow DOM injection
 * @returns {string} CSS styles
 */
export function getStyles() {
  return `
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Container */
    .lac-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Floating Button */
    .lac-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${CONFIG.COLORS.primary};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .lac-widget-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
    }

    .lac-widget-button:focus {
      outline: 2px solid ${CONFIG.COLORS.secondary};
      outline-offset: 2px;
    }

    .lac-widget-button svg {
      width: 28px;
      height: 28px;
      fill: ${CONFIG.COLORS.white};
    }

    /* Chat Popup Container */
    .lac-chat-container {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 600px;
      background: ${CONFIG.COLORS.white};
      border-radius: ${CONFIG.BORDER_RADIUS};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    .lac-chat-container.open {
      display: flex;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Header */
    .lac-chat-header {
      background: ${CONFIG.COLORS.primary};
      color: ${CONFIG.COLORS.white};
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .lac-chat-title {
      font-size: 16px;
      font-weight: 600;
    }

    .lac-close-button {
      background: none;
      border: none;
      color: ${CONFIG.COLORS.white};
      font-size: 24px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .lac-close-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .lac-close-button:focus {
      outline: 2px solid ${CONFIG.COLORS.white};
      outline-offset: 2px;
    }

    /* Messages Area */
    .lac-messages-area {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: ${CONFIG.COLORS.background};
    }

    .lac-messages-area::-webkit-scrollbar {
      width: 6px;
    }

    .lac-messages-area::-webkit-scrollbar-track {
      background: transparent;
    }

    .lac-messages-area::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }

    /* Message Bubble */
    .lac-message {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
    }

    .lac-message.user {
      align-items: flex-end;
    }

    .lac-message.assistant {
      align-items: flex-start;
    }

    .lac-message.error {
      align-items: flex-start;
    }

    .lac-message-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: ${CONFIG.BORDER_RADIUS};
      word-wrap: break-word;
      line-height: 1.5;
    }

    .lac-message.user .lac-message-bubble {
      background: ${CONFIG.COLORS.primary};
      color: ${CONFIG.COLORS.white};
    }

    .lac-message.assistant .lac-message-bubble {
      background: ${CONFIG.COLORS.white};
      color: ${CONFIG.COLORS.text};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .lac-message.error .lac-message-bubble {
      background: ${CONFIG.COLORS.error};
      color: ${CONFIG.COLORS.white};
    }

    .lac-message-time {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
    }

    /* Typing Indicator */
    .lac-typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: ${CONFIG.COLORS.white};
      border-radius: ${CONFIG.BORDER_RADIUS};
      width: fit-content;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .lac-typing-dot {
      width: 8px;
      height: 8px;
      background: ${CONFIG.COLORS.primary};
      border-radius: 50%;
      animation: typingBounce 1.4s infinite ease-in-out;
    }

    .lac-typing-dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .lac-typing-dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes typingBounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    /* Error Retry Button */
    .lac-retry-button {
      margin-top: 8px;
      padding: 8px 16px;
      background: ${CONFIG.COLORS.white};
      color: ${CONFIG.COLORS.error};
      border: 1px solid ${CONFIG.COLORS.white};
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .lac-retry-button:hover {
      background: rgba(255, 255, 255, 0.9);
    }

    /* Input Area */
    .lac-input-area {
      padding: 16px 20px;
      background: ${CONFIG.COLORS.white};
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
    }

    .lac-input-textarea {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #d0d0d0;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      resize: none;
      height: 44px;
      transition: border-color 0.2s ease;
    }

    .lac-input-textarea:focus {
      outline: none;
      border-color: ${CONFIG.COLORS.primary};
    }

    .lac-input-counter {
      position: absolute;
      bottom: 20px;
      right: 90px;
      font-size: 11px;
      color: #999;
    }

    .lac-input-counter.warning {
      color: ${CONFIG.COLORS.error};
      font-weight: 600;
    }

    .lac-send-button {
      padding: 0 20px;
      background: ${CONFIG.COLORS.primary};
      color: ${CONFIG.COLORS.white};
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .lac-send-button:hover:not(:disabled) {
      background: #e08a8a;
    }

    .lac-send-button:disabled {
      background: #d0d0d0;
      cursor: not-allowed;
    }

    .lac-send-button:focus {
      outline: 2px solid ${CONFIG.COLORS.secondary};
      outline-offset: 2px;
    }

    /* Mobile Responsive */
    @media (max-width: 767px) {
      .lac-chat-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        border-radius: 0;
      }

      .lac-widget-button {
        bottom: 20px;
        right: 20px;
      }

      .lac-message-bubble {
        max-width: 85%;
      }
    }

    /* Accessibility */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;
}
