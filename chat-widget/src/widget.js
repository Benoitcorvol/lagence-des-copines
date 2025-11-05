/**
 * L'Agence des Copines - Chat Widget
 * Vanilla JavaScript Widget with Shadow DOM
 * Version: 1.0.0
 *
 * Stories implemented: 2.1-2.9
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_URL: 'https://chat.lagencedescopines.com/webhook/chat',
    COLORS: {
      primary: '#f29b9b',      // Rose doux (brand color)
      secondary: '#493f3c',    // Brun foncé (brand color)
      background: '#f7f7f8',   // Gris clair
      text: '#333333',
      white: '#ffffff',
      error: '#ff9800'
    },
    BORDER_RADIUS: '15px',
    CACHE_DURATION: 5 * 60 * 1000,  // 5 minutes
    MAX_RETRY: 1,
    TIMEOUT: 15000,  // 15 seconds
    MAX_MESSAGE_LENGTH: 2000
  };

  // Error messages (French)
  const ERROR_MESSAGES = {
    NETWORK_ERROR: "Oups, problème de connexion. Peux-tu réessayer ?",
    RATE_LIMIT: "Tu as envoyé beaucoup de messages ! Attends quelques instants.",
    SERVICE_ERROR: "Désolée, je rencontre un petit souci technique. Réessaie dans un instant !",
    TIMEOUT: "La réponse prend un peu de temps... Peux-tu renvoyer ton message ?",
    INVALID_MESSAGE: "Oups, ton message semble vide. Écris-moi quelque chose !"
  };

  // Utility: Generate UUID v4
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Utility: Debug logging
  function debug(...args) {
    if (localStorage.getItem('lac_debug') === 'true') {
      console.log('[LAC Widget]', new Date().toISOString(), ...args);
    }
  }

  // Utility: Sleep/delay
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility: Format time (HH:MM)
  function formatTime(date) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Utility: Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: Get or create user ID
  function getUserId() {
    let userId = localStorage.getItem('lac_user_id');
    if (!userId) {
      userId = generateUUID();
      localStorage.setItem('lac_user_id', userId);
      debug('Created new user ID:', userId);
    }
    return userId;
  }

  // Utility: Get or create conversation ID
  function getConversationId() {
    let conversationId = localStorage.getItem('lac_conversation_id');
    if (!conversationId) {
      conversationId = generateUUID();
      localStorage.setItem('lac_conversation_id', conversationId);
      debug('Created new conversation ID:', conversationId);
    }
    return conversationId;
  }

  // Utility: Load messages from cache
  function loadMessagesFromCache() {
    try {
      const cached = localStorage.getItem('lac_messages_cache');
      const timestamp = localStorage.getItem('lac_cache_timestamp');

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

  // Utility: Save messages to cache
  function saveMessagesToCache(messages) {
    try {
      localStorage.setItem('lac_messages_cache', JSON.stringify(messages));
      localStorage.setItem('lac_cache_timestamp', Date.now().toString());
      debug('Messages saved to cache:', messages.length);
    } catch (error) {
      debug('Error saving cache:', error);
    }
  }

  // Chat Widget Web Component
  class ChatWidget extends HTMLElement {
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

    addWelcomeMessage() {
      const welcomeMessages = [
        "Salut ! Je suis l'assistante des Copines. Comment puis-je t'aider aujourd'hui ? 💕",
        "Coucou ! Besoin d'un coup de main ? Je suis là pour toi ! 🌸",
        "Hello ! Pose-moi toutes tes questions, je suis là pour t'accompagner ! ✨"
      ];
      const welcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

      this.messages.push({
        role: 'assistant',
        content: welcome,
        timestamp: new Date().toISOString()
      });
      this.renderMessages();
      saveMessagesToCache(this.messages);
    }

    render() {
      const styles = this.getStyles();
      const html = this.getHTML();

      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        ${html}
      `;
    }

    getStyles() {
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

    getHTML() {
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
              <button class="lac-close-button" aria-label="Fermer le chat" title="Fermer">
                ×
              </button>
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

    updateSendButtonState() {
      const textarea = this.shadowRoot.querySelector('.lac-input-textarea');
      const sendButton = this.shadowRoot.querySelector('.lac-send-button');
      const isEmpty = !textarea.value.trim();

      sendButton.disabled = isEmpty || this.isSending;
    }

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

    hideTypingIndicator() {
      const indicator = this.shadowRoot.querySelector('#typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    }

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
          this.sendMessageToAPI(lastMessage);
        }
      };

      div.appendChild(bubble);
      div.appendChild(retryButton);
      messagesArea.appendChild(div);
      this.scrollToBottom();

      debug('Error shown:', errorType);
    }

    scrollToBottom() {
      const messagesArea = this.shadowRoot.querySelector('.lac-messages-area');
      setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }, 100);
    }

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

      // Show typing indicator
      this.showTypingIndicator();

      // Send to API
      await this.sendMessageToAPI(message);
    }

    async sendMessageToAPI(message, retryCount = 0) {
      this.isSending = true;
      this.updateSendButtonState();

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

        debug('Message sent successfully:', data);

      } catch (error) {
        debug('Error sending message:', error);

        // Hide typing indicator
        this.hideTypingIndicator();

        // Auto-retry once (silent)
        if (retryCount < CONFIG.MAX_RETRY && error.name !== 'AbortError') {
          debug('Auto-retry attempt:', retryCount + 1);
          await sleep(2000);
          return this.sendMessageToAPI(message, retryCount + 1);
        }

        // Show error to user
        let errorType = 'SERVICE_ERROR';
        if (error.name === 'AbortError') {
          errorType = 'TIMEOUT';
        } else if (error.message === 'RATE_LIMIT') {
          errorType = 'RATE_LIMIT';
        } else if (error.message.includes('fetch')) {
          errorType = 'NETWORK_ERROR';
        }

        this.showError(errorType, message);

      } finally {
        this.isSending = false;
        this.updateSendButtonState();
      }
    }
  }

  // Register custom element
  if (!customElements.get('lac-chat-widget')) {
    customElements.define('lac-chat-widget', ChatWidget);
    debug('Custom element registered: lac-chat-widget');
  }

  // Auto-inject widget on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }

  function injectWidget() {
    if (!document.querySelector('lac-chat-widget')) {
      const widget = document.createElement('lac-chat-widget');
      document.body.appendChild(widget);
      debug('Widget injected into DOM');
    }
  }

})();
