/**
 * Unit tests for ChatWidget component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatWidget } from '../../src/modules/ChatWidget.js';

describe('ChatWidget', () => {
  let widget;

  beforeEach(() => {
    // Define custom element if not already defined
    if (!customElements.get('lac-chat-widget')) {
      customElements.define('lac-chat-widget', ChatWidget);
    }

    widget = new ChatWidget();
    document.body.appendChild(widget);

    localStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    document.body.removeChild(widget);
  });

  describe('constructor', () => {
    it('should create a ChatWidget instance', () => {
      expect(widget).toBeInstanceOf(ChatWidget);
      expect(widget).toBeInstanceOf(HTMLElement);
    });

    it('should initialize with default state', () => {
      expect(widget.isOpen).toBe(false);
      // Note: messages array will have a welcome message after connectedCallback
      expect(Array.isArray(widget.messages)).toBe(true);
      expect(widget.isSending).toBe(false);
    });

    it('should attach shadow DOM', () => {
      expect(widget.shadowRoot).toBeTruthy();
      expect(widget.shadowRoot.mode).toBe('open');
    });
  });

  describe('rendering', () => {
    it('should render widget button', () => {
      const button = widget.shadowRoot.querySelector('.lac-widget-button');
      expect(button).toBeTruthy();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render chat container', () => {
      const container = widget.shadowRoot.querySelector('.lac-chat-container');
      expect(container).toBeTruthy();
      expect(container.classList.contains('open')).toBe(false);
    });

    it('should render header with title', () => {
      const title = widget.shadowRoot.querySelector('.lac-chat-title');
      expect(title.textContent).toBe("L'Agence des Copines");
    });

    it('should render input area', () => {
      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      const sendButton = widget.shadowRoot.querySelector('.lac-send-button');

      expect(textarea).toBeTruthy();
      expect(sendButton).toBeTruthy();
    });

    it('should render character counter', () => {
      const counter = widget.shadowRoot.querySelector('.lac-input-counter');
      expect(counter.textContent).toContain('0/2000');
    });
  });

  describe('toggleChat', () => {
    it('should open chat when called with true', () => {
      widget.toggleChat(true);

      const container = widget.shadowRoot.querySelector('.lac-chat-container');
      expect(container.classList.contains('open')).toBe(true);
      expect(widget.isOpen).toBe(true);
    });

    it('should close chat when called with false', () => {
      widget.toggleChat(true);
      widget.toggleChat(false);

      const container = widget.shadowRoot.querySelector('.lac-chat-container');
      expect(container.classList.contains('open')).toBe(false);
      expect(widget.isOpen).toBe(false);
    });
  });

  describe('updateCharacterCounter', () => {
    it('should update counter with current length', () => {
      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      const counter = widget.shadowRoot.querySelector('.lac-input-counter');

      textarea.value = 'Hello';
      widget.updateCharacterCounter();

      expect(counter.textContent).toBe('5/2000');
    });

    it('should add warning class when near limit', () => {
      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      const counter = widget.shadowRoot.querySelector('.lac-input-counter');

      textarea.value = 'x'.repeat(1900); // 95% of 2000
      widget.updateCharacterCounter();

      expect(counter.classList.contains('warning')).toBe(true);
    });

    it('should remove warning class when below threshold', () => {
      const counter = widget.shadowRoot.querySelector('.lac-input-counter');
      counter.classList.add('warning');

      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      textarea.value = 'Short text';
      widget.updateCharacterCounter();

      expect(counter.classList.contains('warning')).toBe(false);
    });
  });

  describe('updateSendButtonState', () => {
    it('should disable button when textarea is empty', () => {
      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      const sendButton = widget.shadowRoot.querySelector('.lac-send-button');

      textarea.value = '';
      widget.updateSendButtonState();

      expect(sendButton.disabled).toBe(true);
    });

    it('should enable button when textarea has text', () => {
      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      const sendButton = widget.shadowRoot.querySelector('.lac-send-button');

      textarea.value = 'Hello';
      widget.updateSendButtonState();

      expect(sendButton.disabled).toBe(false);
    });

    it('should disable button when sending', () => {
      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      const sendButton = widget.shadowRoot.querySelector('.lac-send-button');

      textarea.value = 'Hello';
      widget.isSending = true;
      widget.updateSendButtonState();

      expect(sendButton.disabled).toBe(true);
    });
  });

  describe('messages', () => {
    it('should render messages correctly', () => {
      widget.messages = [
        { role: 'user', content: 'Hello', timestamp: '2025-01-01T00:00:00Z' },
        { role: 'assistant', content: 'Hi!', timestamp: '2025-01-01T00:00:01Z' }
      ];

      widget.renderMessages();

      const messages = widget.shadowRoot.querySelectorAll('.lac-message');
      expect(messages.length).toBe(2);
      expect(messages[0].classList.contains('user')).toBe(true);
      expect(messages[1].classList.contains('assistant')).toBe(true);
    });

    it('should escape HTML in messages', () => {
      widget.messages = [
        { role: 'user', content: '<script>alert("XSS")</script>', timestamp: '2025-01-01T00:00:00Z' }
      ];

      widget.renderMessages();

      const bubble = widget.shadowRoot.querySelector('.lac-message-bubble');
      expect(bubble.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('typing indicator', () => {
    it('should show typing indicator', () => {
      widget.showTypingIndicator();

      const indicator = widget.shadowRoot.querySelector('#typing-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should hide typing indicator', () => {
      widget.showTypingIndicator();
      widget.hideTypingIndicator();

      const indicator = widget.shadowRoot.querySelector('#typing-indicator');
      expect(indicator).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should show error message', () => {
      widget.showError('NETWORK_ERROR', 'test message');

      const errorMessage = widget.shadowRoot.querySelector('.lac-message.error');
      expect(errorMessage).toBeTruthy();
    });

    it('should show retry button on error', () => {
      widget.showError('NETWORK_ERROR', 'test message');

      const retryButton = widget.shadowRoot.querySelector('.lac-retry-button');
      expect(retryButton).toBeTruthy();
      expect(retryButton.textContent).toBe('Réessayer');
    });
  });

  describe('reset conversation', () => {
    it('should have reset button in header', () => {
      const resetButton = widget.shadowRoot.querySelector('.lac-reset-button');
      expect(resetButton).toBeTruthy();
      expect(resetButton.getAttribute('aria-label')).toBe('Nouvelle conversation');
    });

    it('should clear messages when reset is called', () => {
      widget.messages = [
        { role: 'user', content: 'Test 1', timestamp: '2025-01-01T00:00:00Z' },
        { role: 'assistant', content: 'Response 1', timestamp: '2025-01-01T00:00:01Z' },
        { role: 'user', content: 'Test 2', timestamp: '2025-01-01T00:00:02Z' }
      ];

      widget.resetConversation();

      // Should only have welcome message
      expect(widget.messages.length).toBe(1);
      expect(widget.messages[0].role).toBe('assistant');
    });

    it('should clear textarea when reset is called', () => {
      const textarea = widget.shadowRoot.querySelector('.lac-input-textarea');
      textarea.value = 'Some text';

      widget.resetConversation();

      expect(textarea.value).toBe('');
    });

    it('should add new welcome message on reset', () => {
      widget.messages = [
        { role: 'user', content: 'Old message', timestamp: '2025-01-01T00:00:00Z' }
      ];

      widget.resetConversation();

      expect(widget.messages.length).toBe(1);
      expect(widget.messages[0].role).toBe('assistant');
      expect(widget.messages[0].content).toMatch(/Salut|Coucou|Hello/);
    });
  });
});
