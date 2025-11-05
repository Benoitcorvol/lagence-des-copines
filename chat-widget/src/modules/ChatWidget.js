/**
 * ChatWidget Web Component
 * @module ChatWidget
 */

import { CONFIG, ERROR_MESSAGES, WELCOME_MESSAGES } from './config.js';
import { debug, formatTime, escapeHtml, getRandomItem } from './utils.js';
import { loadMessagesFromCache, saveMessagesToCache, getUserId } from './storage.js';
import { sendMessageToAPI, getErrorType } from './api.js';
import { getStyles } from './styles.js';
import { getHTML } from './template.js';

/**
 * Chat Widget Web Component
 * Handles all UI interactions and message management
 */
export class ChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.messages = [];
    this.isSending = false;
    debug('ChatWidget constructor called');
  }

  connectedCallback() {
    debug('ChatWidget connected to DOM');
    this.render();
    this.attachEventListeners();

    // Initialize user and load cached messages
    getUserId();
    this.loadCachedMessages();
  }

  /**
   * Load messages from cache or show welcome message
   */
  loadCachedMessages() {
    const cached = loadMessagesFromCache();
    if (cached && Array.isArray(cached)) {
      this.messages = cached;
      this.renderMessages();
      debug('Loaded messages from cache:', this.messages.length);
    } else {
      // Show welcome message
      this.addWelcomeMessage();
    }
  }

  /**
   * Add a random welcome message
   */
  addWelcomeMessage() {
    const welcome = getRandomItem(WELCOME_MESSAGES);

    this.messages.push({
      role: 'assistant',
      content: welcome,
      timestamp: new Date().toISOString()
    });
    this.renderMessages();
    saveMessagesToCache(this.messages);
  }

  /**
   * Render the component (styles + HTML)
   */
  render() {
    const styles = getStyles();
    const html = getHTML();

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
  }

  /**
   * Attach all event listeners
   */
  attachEventListeners() {
    const button = this.shadowRoot.querySelector('.lac-widget-button');
    const closeButton = this.shadowRoot.querySelector('.lac-close-button');
    const textarea = this.shadowRoot.querySelector('.lac-input-textarea');
    const sendButton = this.shadowRoot.querySelector('.lac-send-button');

    // Open chat
    button.addEventListener('click', () => {
      this.toggleChat(true);
    });

    // Close chat
    closeButton.addEventListener('click', () => {
      this.toggleChat(false);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.toggleChat(false);
      }
    });

    // Character counter
    textarea.addEventListener('input', () => {
      this.updateCharacterCounter();
      this.updateSendButtonState();
    });

    // Send on Enter (without Shift)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send on button click
    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    debug('Event listeners attached');
  }

  /**
   * Update character counter display
   */
  updateCharacterCounter() {
    const textarea = this.shadowRoot.querySelector('.lac-input-textarea');
    const counter = this.shadowRoot.querySelector('.lac-input-counter');
    const length = textarea.value.length;

    counter.textContent = `${length}/${CONFIG.MAX_MESSAGE_LENGTH}`;

    if (length > CONFIG.MAX_MESSAGE_LENGTH * 0.9) {
      counter.classList.add('warning');
    } else {
      counter.classList.remove('warning');
    }
  }

  /**
   * Update send button enabled/disabled state
   */
  updateSendButtonState() {
    const textarea = this.shadowRoot.querySelector('.lac-input-textarea');
    const sendButton = this.shadowRoot.querySelector('.lac-send-button');
    const isEmpty = !textarea.value.trim();

    sendButton.disabled = isEmpty || this.isSending;
  }

  /**
   * Toggle chat open/closed
   * @param {boolean} open - True to open, false to close
   */
  toggleChat(open) {
    const chatContainer = this.shadowRoot.querySelector('.lac-chat-container');
    const textarea = this.shadowRoot.querySelector('.lac-input-textarea');

    if (open) {
      chatContainer.classList.add('open');
      this.isOpen = true;
      debug('Chat opened');

      // Focus on textarea when opening
      setTimeout(() => {
        if (textarea) textarea.focus();
      }, 100);
    } else {
      chatContainer.classList.remove('open');
      this.isOpen = false;
      debug('Chat closed');
    }
  }

  /**
   * Render all messages in the messages area
   */
  renderMessages() {
    const messagesArea = this.shadowRoot.querySelector('.lac-messages-area');
    messagesArea.innerHTML = '';

    this.messages.forEach(msg => {
      const messageEl = this.createMessageElement(msg);
      messagesArea.appendChild(messageEl);
    });

    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Create a message DOM element
   * @param {Object} message - Message object {role, content, timestamp}
   * @returns {HTMLElement} Message element
   */
  createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `lac-message ${message.role}`;

    const bubble = document.createElement('div');
    bubble.className = 'lac-message-bubble';
    bubble.innerHTML = escapeHtml(message.content);

    const time = document.createElement('div');
    time.className = 'lac-message-time';
    time.textContent = formatTime(new Date(message.timestamp));

    div.appendChild(bubble);
    div.appendChild(time);

    return div;
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const messagesArea = this.shadowRoot.querySelector('.lac-messages-area');

    const div = document.createElement('div');
    div.className = 'lac-message assistant';
    div.id = 'typing-indicator';

    const indicator = document.createElement('div');
    indicator.className = 'lac-typing-indicator';
    indicator.innerHTML = `
      <div class="lac-typing-dot"></div>
      <div class="lac-typing-dot"></div>
      <div class="lac-typing-dot"></div>
    `;

    div.appendChild(indicator);
    messagesArea.appendChild(div);
    this.scrollToBottom();

    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = 'L\'assistante est en train d\'écrire...';
    div.appendChild(announcement);
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const indicator = this.shadowRoot.querySelector('#typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Show error message with retry button
   * @param {string} errorType - Error type key
   * @param {string|null} lastMessage - Last message for retry
   */
  showError(errorType, lastMessage = null) {
    const messagesArea = this.shadowRoot.querySelector('.lac-messages-area');

    const div = document.createElement('div');
    div.className = 'lac-message error';

    const bubble = document.createElement('div');
    bubble.className = 'lac-message-bubble';
    bubble.textContent = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.SERVICE_ERROR;

    const retryButton = document.createElement('button');
    retryButton.className = 'lac-retry-button';
    retryButton.textContent = 'Réessayer';
    retryButton.onclick = () => {
      div.remove();
      if (lastMessage) {
        this.handleMessageSend(lastMessage);
      }
    };

    div.appendChild(bubble);
    div.appendChild(retryButton);
    messagesArea.appendChild(div);
    this.scrollToBottom();

    debug('Error shown:', errorType);
  }

  /**
   * Scroll messages area to bottom
   */
  scrollToBottom() {
    const messagesArea = this.shadowRoot.querySelector('.lac-messages-area');
    setTimeout(() => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 100);
  }

  /**
   * Send message handler (from textarea)
   */
  async sendMessage() {
    const textarea = this.shadowRoot.querySelector('.lac-input-textarea');
    const message = textarea.value.trim();

    if (!message || this.isSending) {
      return;
    }

    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
      this.showError('INVALID_MESSAGE');
      return;
    }

    // Add user message to UI
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    this.messages.push(userMessage);
    this.renderMessages();
    saveMessagesToCache(this.messages);

    // Clear textarea
    textarea.value = '';
    this.updateCharacterCounter();
    this.updateSendButtonState();

    // Send to API
    await this.handleMessageSend(message);
  }

  /**
   * Handle sending message to API
   * @param {string} message - Message text to send
   */
  async handleMessageSend(message) {
    this.isSending = true;
    this.updateSendButtonState();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      const data = await sendMessageToAPI(message);

      // Hide typing indicator
      this.hideTypingIndicator();

      // Add bot response
      const botMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString(),
        agentType: data.agentType
      };

      this.messages.push(botMessage);
      this.renderMessages();
      saveMessagesToCache(this.messages);

    } catch (error) {
      // Hide typing indicator
      this.hideTypingIndicator();

      // Show error to user
      const errorType = getErrorType(error);
      this.showError(errorType, message);

    } finally {
      this.isSending = false;
      this.updateSendButtonState();
    }
  }
}
