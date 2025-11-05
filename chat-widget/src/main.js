/**
 * L'Agence des Copines - Chat Widget
 * Main entry point
 * Version: 2.0.0 (Modular)
 */

import { ChatWidget } from './modules/ChatWidget.js';
import { debug } from './modules/utils.js';

/**
 * Register the custom element
 */
if (!customElements.get('lac-chat-widget')) {
  customElements.define('lac-chat-widget', ChatWidget);
  debug('Custom element registered: lac-chat-widget');
}

/**
 * Inject widget into the DOM
 */
function injectWidget() {
  if (!document.querySelector('lac-chat-widget')) {
    const widget = document.createElement('lac-chat-widget');
    document.body.appendChild(widget);
    debug('Widget injected into DOM');
  }
}

/**
 * Auto-inject on DOMContentLoaded
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectWidget);
} else {
  injectWidget();
}
