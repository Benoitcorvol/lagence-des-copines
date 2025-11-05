# Changelog - L'Agence des Copines Chat Widget

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-11-03

### ✨ Epic 2 Complete - Chat Widget UI (Stories 2.1-2.9)

### Added

#### Widget Foundation (Stories 2.1-2.3)
- **Shadow DOM isolation** for complete CSS/JS encapsulation
- **Web Component** `<lac-chat-widget>` with auto-injection
- **Floating button** (60x60px, rose #f29b9b) with hover effects
- **Desktop popup** (400x600px) with slide-up animation
- **Mobile fullscreen mode** (<768px) with smooth transitions
- **Header** with "L'Agence des Copines" title and close button
- **Messages area** with custom scrollbar styling
- **Input area** with textarea and send button

#### Message UI (Story 2.5)
- **User message bubbles** (right-aligned, rose background, white text)
- **Bot message bubbles** (left-aligned, white background, dark text)
- **Timestamps** below each message (HH:MM format)
- **Character counter** (0/2000) with warning at 90% capacity
- **Auto-scroll** to bottom on new messages
- **Send on Enter** (Shift+Enter for newline)
- **Button state management** (disabled when empty or sending)
- **XSS prevention** with HTML escaping

#### Typing Indicator (Story 2.6)
- **3 animated dots** with staggered bounce animation
- **Rose color** matching brand (#f29b9b)
- **Auto-show** when user sends message
- **Auto-hide** when bot responds
- **Screen reader announcement** ("L'assistante est en train d'écrire...")

#### Persistence (Story 2.7)
- **localStorage caching** with 5-minute expiration
- **UUID generation** for users and conversations (crypto.randomUUID)
- **Welcome messages** (3 randomized variants) on first visit
- **Cache restoration** on page load (<100ms)
- **Cache age verification** to prevent stale data
- **Conversation continuity** across page reloads

#### Error Handling (Story 2.8)
- **French error messages** for all error types:
  - Network errors: "Oups, problème de connexion..."
  - Timeout errors: "La réponse prend un peu de temps..."
  - Rate limit: "Tu as envoyé beaucoup de messages..."
  - Service errors: "Je rencontre un petit souci technique..."
- **Auto-retry mechanism** (1x silent, 2s delay)
- **Manual retry button** below error messages
- **Error type detection** (network, timeout, rate limit, API error)
- **Visual distinction** (orange background for errors)

#### API Communication (Story 2.9)
- **POST to n8n webhook** at `/webhook/chat`
- **JSON payload** with userId, conversationId, message, timestamp
- **15-second timeout** with AbortController
- **Response parsing** and validation
- **Status code handling** (200, 429, 4xx, 5xx)
- **Integration with error handling** system

### Performance

- **Bundle size**: 5.21 KB gzipped (target: <50 KB) ✅
- **Source code**: 919 lines
- **Load time**: <0.5s (asynchronous)
- **First render**: <100ms (instant cache)
- **API timeout**: 15s max

### Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** (Tab, Enter, Escape)
- **Screen reader support** with aria-live announcements
- **Focus indicators** (visible outlines)
- **Contrast ratio**: WCAG AA compliant
- **Screen reader-only text** (.sr-only class)

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Chrome Mobile (Android)

### Documentation

- **README.md**: Developer documentation
- **KAJABI_INTEGRATION.md**: Complete Kajabi integration guide
- **IMPLEMENTATION_SUMMARY.md**: Full implementation details
- **CHANGELOG.md**: This file
- **test/test.html**: Basic test page
- **test/demo.html**: Full feature demonstration

### Development Tools

- **package.json**: NPM configuration
- **build.sh**: Build script with bundle size reporting
- **Terser**: JavaScript minification
- **Source maps**: Debugging support

### Configuration

- **API_URL**: `https://chat.lagencedescopines.com/webhook/chat`
- **CACHE_DURATION**: 5 minutes (300,000ms)
- **MAX_RETRY**: 1 attempt (2s delay)
- **TIMEOUT**: 15 seconds
- **MAX_MESSAGE_LENGTH**: 2000 characters
- **COLORS**: Brand-matched (rose #f29b9b, brun #493f3c)

---

## [Unreleased] - Pending Deployment

### Todo (Story 2.10)

- [ ] Deploy widget.min.js to VPS at `/var/www/chat-widget/dist/`
- [ ] Configure Nginx route for `/widget.js`
- [ ] Test production URL: `https://chat.lagencedescopines.com/widget.js`
- [ ] Verify GZIP compression enabled
- [ ] Verify CORS headers configured

### Todo (Story 2.11)

- [ ] Add widget script to Kajabi staging site
- [ ] Test on staging Kajabi environment
- [ ] Verify no CSS conflicts with Kajabi themes
- [ ] Test on multiple Kajabi pages
- [ ] Create video tutorial (optional)
- [ ] Deploy to Kajabi production

---

## Future Enhancements (V2.0)

### Planned Features

- **Markdown support** in messages (bold, italic, links)
- **File upload** capability (images, PDFs)
- **Emoji picker** for better UX
- **Conversation history** (load older messages on scroll)
- **Read receipts** (show when bot has seen message)
- **Admin panel** for customizing welcome messages
- **Dark mode** toggle
- **Multi-language support** (EN/FR toggle)
- **Voice input** (speech-to-text)
- **Quick replies** (suggested responses)
- **Agent typing speed** (simulate human-like delays)

### Performance Optimizations

- **Lazy loading** conversation history
- **Virtual scrolling** for long conversations (>100 messages)
- **Image compression** before upload
- **WebSocket connection** (replace HTTP polling)
- **Service Worker** for offline support

### Analytics

- **Conversation metrics** (length, duration, sentiment)
- **User engagement tracking** (opens, sends, response time)
- **Error rate monitoring** (track failure types)
- **Performance metrics** (load time, API latency)

---

## Version History

### [1.0.0] - 2025-11-03 (Current)
- Epic 2 complete: Stories 2.1-2.9 implemented
- Production-ready widget: 5.21 KB gzipped
- Comprehensive documentation and test pages

### [0.1.0] - 2025-11-03 (Initial)
- Project scaffolding
- Basic structure created
- Build tools configured

---

**Maintained by**: Benoit (CTO L'Agence des Copines)
**License**: Proprietary - L'Agence des Copines
**Repository**: Private
