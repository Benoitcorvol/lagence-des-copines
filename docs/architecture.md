# Architecture: Agent IA pour L'Agence des Copines

**Date:** 2025-11-03
**Architect:** Winston (BMAD Architecture Workflow)
**Developer:** Benoit (CTO)
**Client:** L'Agence des Copines
**Timeline:** 5 days
**Budget:** 2,500€ development + <120€/month operational

---

## Executive Summary

This architecture document defines a **production-ready AI chatbot system** with Kajabi-embeddable widget, n8n orchestration backend, RAG knowledge base, and Hostinger VPS deployment. The system is designed for **rapid development (5 days)**, **cost efficiency (<120€/month)**, and **maintainability by Benoit** without ongoing developer intervention.

**Key Architectural Decisions:**
- **Vanilla JavaScript + Shadow DOM** for zero-conflict Kajabi embedding
- **Unified VPS deployment** (widget + n8n on same server) for simplicity
- **HTTP synchronous communication** for straightforward implementation
- **Brand-matched UI** inspired by L'Agence des Copines website
- **Accessibility-first design** (WCAG AA compliance)

---

## Project Initialization

### Environment Setup

**VPS Hostinger Configuration:**
```bash
# 1. Install Docker & Docker Compose
sudo apt update && sudo apt install -y docker.io docker-compose

# 2. Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# 3. Configure SSL for chat.lagencedescopines.com
sudo certbot --nginx -d chat.lagencedescopines.com

# 4. Deploy n8n via Docker Compose (see Infrastructure section)
cd /opt/n8n && docker-compose up -d
```

**Widget Development Setup:**
```bash
# 1. Create project structure
mkdir -p /var/www/chat-widget/{src,dist}
cd /var/www/chat-widget

# 2. Initialize project
npm init -y
npm install --save-dev terser  # For minification

# 3. Create source files
touch src/widget.js src/config.js src/utils.js
touch test.html README.md
```

---

## Decision Summary

| Category | Decision | Version/Spec | Rationale | Affects Components |
|----------|----------|--------------|-----------|-------------------|
| **Widget Technology** | Vanilla JavaScript + Shadow DOM | ES6+ | Zero dependencies, Kajabi-safe isolation, <50kb bundle | Widget |
| **Build Tool** | Terser (minification only) | Latest | Minimal tooling, fast builds, no framework overhead | Widget |
| **Communication Protocol** | HTTP POST Synchronous | - | Simplest implementation, 10s timeout acceptable | Widget ↔ n8n |
| **State Management** | localStorage | Web API | Browser-native, no cookies needed, simple persistence | Widget |
| **User Identification** | Anonymous UUID | UUID v4 | Zero friction MVP, email capture in V2 | Widget, Supabase |
| **UI Framework** | None (Pure DOM) | - | Lightweight, full control, brand customization | Widget |
| **CSS Strategy** | Shadow DOM Scoped | Web Components | Prevents Kajabi conflicts, total style isolation | Widget |
| **Design System** | L'Agence des Copines Brand | Custom | Rose #f29b9b, Brun #493f3c, 15px border-radius | Widget UI |
| **Accessibility** | WCAG AA | WCAG 2.1 | Keyboard nav, ARIA labels, 4.5:1 contrast | Widget |
| **Error Handling** | 1 Auto Retry + Manual | - | Professional UX, silent recovery, user control | Widget |
| **Mobile Strategy** | Fullscreen (<768px) | - | Standard chat UX, keyboard-friendly | Widget Responsive |
| **Typing Indicator** | Animated Dots Bubble | - | Recognizable pattern, reassures users | Widget UI |
| **API Format** | JSON ISO 8601 Dates | - | Standard, interoperable, timezone-safe | Widget ↔ n8n ↔ Supabase |
| **Security** | CORS + Rate Limiting | 10 msg/min | Prevents abuse, protects API costs | n8n Webhook |
| **Message History** | Full Load (no pagination) | - | Simpler implementation, adequate for <50 msgs | Widget, Supabase |
| **Performance** | Lazy Load + Cache | 5min cache | Loads history only on open, reduces API calls | Widget |
| **Logging** | Debug Flag | localStorage | Production-safe debugging, remote diagnostics | Widget |
| **Hosting** | Unified VPS | Hostinger | Single server, shared SSL, cost-effective | Infrastructure |
| **Domain** | Subdomain | chat.lagencedescopines.com | Clean separation, easy DNS config | Deployment |
| **SSL** | Let's Encrypt | Certbot | Free, auto-renewal, industry standard | Nginx |
| **Reverse Proxy** | Nginx | Latest stable | Handles SSL, static files, n8n proxy | Infrastructure |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ KAJABI SITE (lagencedescopines.mykajabi.com)                       │
│                                                                     │
│  <script src="https://chat.lagencedescopines.com/widget.js">      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ Shadow DOM Widget                                         │     │
│  │ - Isolated CSS (no Kajabi conflicts)                     │     │
│  │ - localStorage: conversationId, userId                   │     │
│  │ - Brand colors: Rose #f29b9b, Brun #493f3c              │     │
│  └──────────────────────────────────────────────────────────┘     │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS POST
                             │ {conversationId, userId, message}
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ VPS HOSTINGER (chat.lagencedescopines.com)                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ NGINX (Reverse Proxy + SSL)                               │    │
│  │ - Port 443 (HTTPS)                                        │    │
│  │ - Let's Encrypt SSL                                       │    │
│  │                                                            │    │
│  │  Routes:                                                   │    │
│  │  /widget.js        → Static file                         │    │
│  │  /webhook/chat     → n8n workflow                        │    │
│  │  /n8n/             → n8n admin UI (password protected)   │    │
│  └───────────────────────────────────────────────────────────┘    │
│                             │                                       │
│                             ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ n8n (Docker Container - Port 5678)                        │    │
│  │                                                            │    │
│  │  Workflow: Message Processing                             │    │
│  │  1. Validate input + Rate limit check                    │    │
│  │  2. Load conversation history (Supabase)                 │    │
│  │  3. Keyword router → Agent (Creation/Automation)         │    │
│  │  4. RAG Query: Embed → pgvector → Rerank                │    │
│  │  5. Claude API call (context + RAG + prompt)            │    │
│  │  6. Loop detection (semantic similarity)                 │    │
│  │  7. Save messages (Supabase)                             │    │
│  │  8. Return response to widget                            │    │
│  └───────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │ PostgreSQL
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SUPABASE (Managed PostgreSQL + pgvector)                           │
│                                                                     │
│  Tables:                                                            │
│  - users (id, created_at)                                          │
│  - conversations (id, user_id, status, last_message_at)           │
│  - messages (id, conversation_id, role, content, agent_type)      │
│  - documents (id, filename, file_type, upload_date)               │
│  - document_chunks (id, document_id, content, embedding)          │
│                                                                     │
│  pgvector: Cosine similarity search for RAG                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ External APIs
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES (called by n8n)                                  │
│                                                                     │
│  - Claude 3.5 Sonnet API (Anthropic) - Conversational AI          │
│  - OpenAI text-embedding-3-small - Text embeddings                │
│  - Cohere rerank-english-v3.0 - Reranking top results            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Chat Widget (Kajabi Embed)

**Technology Stack:**
- Pure Vanilla JavaScript (ES6+)
- Shadow DOM for CSS isolation
- No external dependencies
- Minified bundle: <50kb gzipped

**File Structure:**
```
/var/www/chat-widget/
├── src/
│   ├── widget.js           # Main entry point, Shadow DOM setup
│   ├── config.js           # Configuration (API URL, colors, strings)
│   ├── utils.js            # Helpers (UUID, localStorage, fetch)
│   └── styles.css          # Styles (embedded in Shadow DOM)
├── dist/
│   ├── widget.min.js       # Production build (minified)
│   └── widget.js.map       # Source map for debugging
├── test.html               # Local testing page
├── package.json            # Build scripts
└── README.md               # Integration docs
```

**Key Features:**
- **Shadow DOM Isolation:** Prevents CSS/JS conflicts with Kajabi
- **localStorage Persistence:** Conversation state survives page reload
- **Brand-Matched UI:** Colors and style from L'Agence des Copines site
- **Responsive:** Desktop (400x600px popup) / Mobile (fullscreen)
- **Accessible:** WCAG AA compliant, keyboard navigation, ARIA labels

**Widget Behavior:**

**Desktop (≥768px):**
```
1. Floating button (bottom-right, 60x60px, rose #f29b9b)
2. Click → Popup opens (400x600px, slide-up animation)
3. Auto-load conversation history from localStorage cache
4. If cache expired (>5min) → fetch from Supabase via n8n
```

**Mobile (<768px):**
```
1. Same floating button
2. Click → Fullscreen overlay (100vh, slide-up from bottom)
3. Header with "X" close button
4. Keyboard-friendly (messages stay visible above keyboard)
```

**User Flow:**
```
1. First visit → Generate UUID → Save to localStorage (lac_user_id)
2. Generate conversationId → Save to localStorage (lac_conversation_id)
3. User types message → Click send or press Enter
4. Show typing indicator (animated dots bubble)
5. POST to n8n webhook → Wait for response (10s timeout)
6. Display bot response → Auto-scroll to bottom
7. Conversation persists across page reloads
```

**API Integration Contract:**

**Request (Widget → n8n):**
```javascript
POST https://chat.lagencedescopines.com/webhook/chat
Content-Type: application/json

{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7f3e2a10-c8b5-4f91-9d3a-123456789abc",
  "message": "Comment créer du contenu Instagram engageant?",
  "timestamp": "2025-11-03T14:30:00Z"
}
```

**Response (n8n → Widget):**
```javascript
HTTP 200 OK
Content-Type: application/json

{
  "response": "Pour créer du contenu Instagram engageant, voici mes recommandations...",
  "agentType": "creation",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-03T14:30:08Z"
}
```

**Error Response:**
```javascript
HTTP 500 Internal Server Error
Content-Type: application/json

{
  "error": true,
  "message": "Service temporairement indisponible. Veuillez réessayer.",
  "code": "SERVICE_ERROR"
}
```

**Rate Limit Response:**
```javascript
HTTP 429 Too Many Requests
Content-Type: application/json

{
  "error": true,
  "message": "Trop de messages envoyés. Attendez quelques instants.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

### 2. n8n Orchestration Backend

**n8n handles ALL AI orchestration:**
- Claude API calls
- OpenAI embeddings
- Cohere reranking
- RAG query pipeline
- Conversation memory
- Agent routing (Creation vs Automation)
- Loop detection for upselling

**Widget → n8n interaction is simple HTTP only.**

---

### 3. Infrastructure (Hostinger VPS)

**Single VPS Architecture:**

**Docker Compose Stack:**
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=chat.lagencedescopines.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://chat.lagencedescopines.com
      - GENERIC_TIMEZONE=Europe/Paris
    volumes:
      - n8n_data:/home/node/.n8n
      - /var/www/chat-widget:/data/widget:ro  # Widget files accessible

volumes:
  n8n_data:
```

**Nginx Configuration:**
```nginx
# /etc/nginx/sites-available/chat.lagencedescopines.com

upstream n8n_backend {
    server 127.0.0.1:5678;
}

server {
    listen 80;
    server_name chat.lagencedescopines.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chat.lagencedescopines.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/chat.lagencedescopines.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.lagencedescopines.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # GZIP Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Widget Static File
    location = /widget.js {
        alias /var/www/chat-widget/dist/widget.min.js;

        # CORS for Kajabi
        add_header Access-Control-Allow-Origin "https://lagencedescopines.mykajabi.com" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;

        # Cache for 1 hour (can update widget independently)
        add_header Cache-Control "public, max-age=3600" always;

        expires 1h;
    }

    # Widget Source Map (for debugging)
    location = /widget.js.map {
        alias /var/www/chat-widget/dist/widget.js.map;
        add_header Cache-Control "no-cache" always;
    }

    # n8n Webhooks (public)
    location /webhook/ {
        proxy_pass http://n8n_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout for Claude API calls
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;

        # CORS for Kajabi
        add_header Access-Control-Allow-Origin "https://lagencedescopines.mykajabi.com" always;
        add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;

        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # n8n Admin Interface (protected)
    location /n8n/ {
        proxy_pass http://n8n_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for n8n UI
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Basic auth handled by n8n
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

**Environment Variables (.env):**
```bash
# n8n Admin
N8N_USER=benoit
N8N_PASSWORD=<strong-password>

# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...

# Configuration
RATE_LIMIT_PER_MINUTE=10
MAX_MESSAGE_LENGTH=2000
```

---

## Implementation Patterns

### Naming Conventions

**JavaScript:**
- Variables: `camelCase` (conversationId, messageText, userName)
- Functions: `camelCase` (sendMessage, renderTypingIndicator, loadHistory)
- Constants: `UPPER_SNAKE_CASE` (API_URL, MAX_RETRY_COUNT, CACHE_DURATION)
- Classes: `PascalCase` (ChatWidget, MessageBubble, APIClient)

**CSS (Shadow DOM):**
- Classes: `kebab-case` with `lac-` prefix
  - `.lac-widget-button`
  - `.lac-chat-container`
  - `.lac-message-bubble`
  - `.lac-typing-indicator`
- Prevents all conflicts with Kajabi styles

**localStorage Keys:**
- Prefix: `lac_` (L'Agence des Copines namespace)
- Format: `lac_user_id`, `lac_conversation_id`, `lac_messages_cache`, `lac_cache_timestamp`

**API Endpoints:**
- Format: `/webhook/{action}` (plural nouns)
- Example: `/webhook/chat`, `/webhook/history`

### Code Organization

**Widget Entry Point (widget.js):**
```javascript
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_URL: 'https://chat.lagencedescopines.com/webhook/chat',
    COLORS: {
      primary: '#f29b9b',      // Rose doux
      secondary: '#493f3c',    // Brun foncé
      background: '#f7f7f8',   // Gris clair
      text: '#333333'
    },
    BORDER_RADIUS: '15px',
    CACHE_DURATION: 5 * 60 * 1000,  // 5 minutes
    MAX_RETRY: 1,
    TIMEOUT: 15000  // 15 seconds
  };

  // Shadow DOM initialization
  class ChatWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.init();
    }

    init() {
      // Render widget structure in Shadow DOM
      // Attach event listeners
      // Load conversation state
    }
  }

  // Register custom element
  customElements.define('lac-chat-widget', ChatWidget);

  // Auto-inject widget
  window.addEventListener('DOMContentLoaded', () => {
    const widget = document.createElement('lac-chat-widget');
    document.body.appendChild(widget);
  });
})();
```

### Error Handling Pattern

**All API calls follow this pattern:**
```javascript
async function sendMessage(message) {
  const MAX_RETRY = 1;
  let attempt = 0;

  while (attempt <= MAX_RETRY) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: getConversationId(),
          userId: getUserId(),
          message: message,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(CONFIG.TIMEOUT)
      });

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

      return data;

    } catch (error) {
      attempt++;

      if (attempt > MAX_RETRY) {
        // Show error to user
        showErrorMessage(
          error.message === 'RATE_LIMIT'
            ? 'Trop de messages envoyés. Attendez quelques instants.'
            : 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
          true  // Show retry button
        );
        throw error;
      }

      // Silent retry after 2 seconds
      await sleep(2000);
    }
  }
}
```

### Logging Pattern

**Debug logs (disabled by default):**
```javascript
function debug(...args) {
  if (localStorage.getItem('lac_debug') === 'true') {
    console.log('[LAC Widget]', new Date().toISOString(), ...args);
  }
}

// Usage
debug('Sending message:', message);
debug('Received response:', response);
debug('Cache hit for conversation:', conversationId);
```

**Enable debugging:**
```javascript
// In browser console
localStorage.setItem('lac_debug', 'true');
location.reload();
```

---

## Data Architecture

### localStorage Schema

```javascript
{
  // User identification (generated on first visit)
  "lac_user_id": "7f3e2a10-c8b5-4f91-9d3a-123456789abc",

  // Current conversation
  "lac_conversation_id": "550e8400-e29b-41d4-a716-446655440000",

  // Message cache (for 5min offline support)
  "lac_messages_cache": "[{\"role\":\"user\",\"content\":\"...\"}]",

  // Cache timestamp (for expiration check)
  "lac_cache_timestamp": "1699012345678",

  // Debug flag
  "lac_debug": "false"
}
```

### Supabase Schema

**Handled by n8n workflows - Widget only interfaces via HTTP**

---

## API Contracts

### Widget → n8n Webhook

**Endpoint:** `POST https://chat.lagencedescopines.com/webhook/chat`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7f3e2a10-c8b5-4f91-9d3a-123456789abc",
  "message": "Comment créer du contenu Instagram?",
  "timestamp": "2025-11-03T14:30:00Z"
}
```

**Success Response (200):**
```json
{
  "response": "Pour créer du contenu Instagram engageant...",
  "agentType": "creation",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-03T14:30:08Z"
}
```

**Error Response (500):**
```json
{
  "error": true,
  "message": "Service temporairement indisponible",
  "code": "SERVICE_ERROR"
}
```

**Rate Limit Response (429):**
```json
{
  "error": true,
  "message": "Trop de messages envoyés. Attendez quelques instants.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Validation Rules:**
- `conversationId`: UUID v4 format, required
- `userId`: UUID v4 format, required
- `message`: String, 1-2000 characters, required
- `timestamp`: ISO 8601 format, required

---

## Security Architecture

### CORS Configuration

**Allowed Origins:**
- `https://lagencedescopines.mykajabi.com` (production Kajabi site)
- `http://localhost:8000` (local testing)

**Allowed Methods:**
- `GET` (widget.js file)
- `POST` (webhook endpoint)
- `OPTIONS` (preflight)

**Nginx CORS Headers:**
```nginx
add_header Access-Control-Allow-Origin "https://lagencedescopines.mykajabi.com" always;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
add_header Access-Control-Allow-Headers "Content-Type" always;
```

### Rate Limiting

**n8n Workflow Rate Limit:**
- **Rule:** Max 10 messages per minute per `conversationId`
- **Implementation:** n8n node checks message count in last 60s from Supabase
- **Response:** HTTP 429 with clear error message
- **Bypass:** None (prevents API cost overruns)

**Purpose:**
- Prevent abuse/spam
- Protect Claude API costs
- Stay under 120€/month budget

### Input Validation

**n8n validates all inputs:**
- Message length: 1-2000 characters
- UUID format validation
- Timestamp format validation
- XSS protection (text sanitization before storage)

### SSL/TLS

**Configuration:**
- Let's Encrypt SSL certificate
- TLS 1.2 and 1.3 only
- Auto-renewal via certbot
- HSTS header (optional for enhanced security)

---

## Performance Considerations

### Widget Performance

**Load Time:**
- Target: <2 seconds first render
- Script size: <50kb minified + gzipped
- Async loading (doesn't block Kajabi page)

**Optimization Strategies:**
1. **Lazy Loading:** Conversation history loaded only when widget opened
2. **Cache Strategy:** 5-minute localStorage cache (reduces Supabase queries)
3. **Minification:** Terser for production build
4. **GZIP Compression:** Nginx serves widget.js with gzip

**Build Command:**
```bash
npx terser src/widget.js -c -m -o dist/widget.min.js --source-map
```

### Response Time Breakdown

**Total Target: <10 seconds**

| Component | Target Time | Notes |
|-----------|-------------|-------|
| Widget → n8n | <500ms | Network latency |
| n8n processing | <2s | Load history, router, RAG query |
| Claude API | <5s | Anthropic API response time |
| n8n → Widget | <500ms | Return response |
| **Total** | **<8s** | Buffer for variance |

### Caching Strategy

**localStorage Cache:**
- **Duration:** 5 minutes
- **Data:** Full conversation history
- **Invalidation:** Timestamp check on widget open
- **Benefits:** Instant history load, reduced API calls

**Nginx Static Cache:**
- **Duration:** 1 hour
- **Data:** widget.min.js file
- **Invalidation:** Cache-Control header
- **Benefits:** Faster widget load, reduced server load

---

## Deployment Architecture

### VPS Server Specifications

**Minimum Requirements:**
- **CPU:** 4 vCPU
- **RAM:** 8GB
- **Storage:** 100GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Network:** 100 Mbps

**Hostinger Plan:** VPS 4 (~30€/month)

### Deployment Steps

**1. Initial Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

**2. DNS Configuration:**
```
Type: A Record
Name: chat
Value: <VPS_IP_ADDRESS>
TTL: 3600
```

**3. SSL Certificate:**
```bash
sudo certbot --nginx -d chat.lagencedescopines.com --non-interactive --agree-tos -m benoit@email.com
```

**4. Deploy n8n:**
```bash
# Create n8n directory
sudo mkdir -p /opt/n8n
cd /opt/n8n

# Create docker-compose.yml (see Infrastructure section)
sudo nano docker-compose.yml

# Create .env file with API keys
sudo nano .env

# Start n8n
sudo docker-compose up -d
```

**5. Deploy Widget:**
```bash
# Create widget directory
sudo mkdir -p /var/www/chat-widget/{src,dist}

# Upload widget files (via SCP/FTP)
# Build widget
cd /var/www/chat-widget
npm run build  # Runs terser minification

# Set permissions
sudo chown -R www-data:www-data /var/www/chat-widget
```

**6. Configure Nginx:**
```bash
# Create site config
sudo nano /etc/nginx/sites-available/chat.lagencedescopines.com
# (See Nginx configuration in Infrastructure section)

# Enable site
sudo ln -s /etc/nginx/sites-available/chat.lagencedescopines.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**7. Test Deployment:**
```bash
# Test widget loads
curl -I https://chat.lagencedescopines.com/widget.js

# Test webhook (should require POST)
curl https://chat.lagencedescopines.com/webhook/chat

# Check n8n
docker logs n8n
```

### Kajabi Integration

**Final Integration Code:**
```html
<!-- Add to Kajabi Site Settings → Custom Code → Footer -->
<script src="https://chat.lagencedescopines.com/widget.js" async></script>
```

**Testing on Kajabi:**
1. Add code to staging site first
2. Test on desktop and mobile
3. Verify no style conflicts
4. Test full conversation flow
5. Deploy to production

---

## Development Environment

### Prerequisites

**Local Development:**
- Node.js 18+ (for Terser)
- Modern browser (Chrome/Firefox/Safari)
- Code editor (VS Code recommended)
- Git for version control

**VPS Access:**
- SSH access to Hostinger VPS
- Sudo privileges
- Domain DNS control

### Local Testing Setup

**Project Structure:**
```bash
/local/chat-widget/
├── src/
│   ├── widget.js
│   ├── config.js
│   └── utils.js
├── test.html          # Local test page
├── package.json
└── build.sh           # Build script
```

**test.html:**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Test - L'Agence des Copines</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 2rem;
      background: #f7f7f8;
    }
    h1 { color: #493f3c; }
  </style>
</head>
<body>
  <h1>Chat Widget Test</h1>
  <p>Le widget devrait apparaître en bas à droite.</p>

  <script src="src/widget.js"></script>
</body>
</html>
```

**Local Development Server:**
```bash
# Simple Python server
python3 -m http.server 8000

# Open http://localhost:8000/test.html
```

**Build Script (build.sh):**
```bash
#!/bin/bash
npx terser src/widget.js -c -m -o dist/widget.min.js --source-map "url=widget.js.map"
echo "Build complete: dist/widget.min.js"
```

### Deployment Workflow

**1. Development:**
```bash
# Edit src/widget.js locally
# Test in test.html
# Enable debug: localStorage.setItem('lac_debug', 'true')
```

**2. Build:**
```bash
chmod +x build.sh
./build.sh
```

**3. Deploy to VPS:**
```bash
# SCP upload
scp dist/widget.min.js user@vps:/var/www/chat-widget/dist/
scp dist/widget.js.map user@vps:/var/www/chat-widget/dist/

# Or use FTP/SFTP client
```

**4. Test on VPS:**
```bash
curl -I https://chat.lagencedescopines.com/widget.js
# Should return 200 OK
```

**5. Clear Nginx cache if needed:**
```bash
# On VPS
sudo systemctl reload nginx
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Vanilla JS over React/Vue

**Status:** Accepted
**Date:** 2025-11-03

**Context:**
Need embeddable widget for Kajabi with zero conflicts and minimal load time.

**Decision:**
Use Vanilla JavaScript with Shadow DOM instead of React/Vue framework.

**Rationale:**
- **Bundle size:** <50kb vs >100kb with framework
- **Zero dependencies:** No version conflicts with Kajabi
- **Shadow DOM:** Native isolation, no CSS-in-JS libraries needed
- **Timeline:** Faster to build simple widget without framework overhead
- **Performance:** No virtual DOM reconciliation

**Consequences:**
- More manual DOM manipulation
- No reactive state management (acceptable for simple chat UI)
- Full browser compatibility control

---

### ADR-002: HTTP Synchronous vs WebSocket

**Status:** Accepted
**Date:** 2025-11-03

**Context:**
Widget needs to communicate with n8n backend. Average response time is 5-10s (Claude API).

**Decision:**
Use HTTP POST synchronous communication with 15s timeout instead of WebSocket.

**Rationale:**
- **Simplicity:** Single POST request, wait for response
- **n8n compatibility:** Webhooks are native to n8n (WebSocket requires custom setup)
- **User expectation:** 5-10s wait is acceptable for AI chat
- **Timeline:** HTTP is faster to implement (5-day constraint)
- **Real-time not needed:** Responses are sequential, not streaming

**Consequences:**
- User sees typing indicator for 5-10 seconds (acceptable)
- Cannot do streaming responses (not needed for MVP)
- Simpler error handling and retry logic

---

### ADR-003: Unified VPS vs Distributed Services

**Status:** Accepted
**Date:** 2025-11-03

**Context:**
Need to host widget (static files), n8n (backend), and handle SSL/routing.

**Decision:**
Deploy everything on single Hostinger VPS with Nginx reverse proxy.

**Rationale:**
- **Cost:** 30€/month VPS vs 30€ + 20€ separate static hosting
- **Simplicity:** Single server to manage, single SSL certificate
- **Same domain:** No CORS complexity (widget and webhook on chat.lagencedescopines.com)
- **Maintenance:** Benoit manages one server, not multiple services
- **Timeline:** Faster deployment with single Docker Compose stack

**Consequences:**
- Single point of failure (acceptable for MVP)
- VPS must handle all traffic (50 concurrent users is well within capacity)
- Easier backup/restore (single server snapshot)

---

### ADR-004: Anonymous Users (UUID) vs Email Required

**Status:** Accepted
**Date:** 2025-11-03

**Context:**
Need to identify users for conversation persistence and analytics.

**Decision:**
Use anonymous UUID generation (localStorage) instead of requiring email upfront.

**Rationale:**
- **Zero friction:** User can start chatting immediately
- **Better engagement:** No signup barrier
- **MVP focus:** Email capture can be added in V2
- **Privacy:** Respects user privacy (GDPR-friendly)
- **Timeline:** Simpler implementation

**Consequences:**
- Cannot email users or send follow-ups (acceptable for MVP)
- Users identified by UUID only (can add email later)
- If user clears localStorage, loses conversation history (acceptable tradeoff)

---

### ADR-005: Fullscreen Mobile vs Popup

**Status:** Accepted
**Date:** 2025-11-03

**Context:**
Mobile screens (<768px) have limited space for chat interface.

**Decision:**
Use fullscreen overlay on mobile instead of partial popup.

**Rationale:**
- **UX Standard:** WhatsApp, Messenger, Intercom all use fullscreen on mobile
- **Keyboard handling:** Fullscreen ensures messages stay visible above keyboard
- **Readability:** More space for conversation history
- **Professional feel:** Matches native app experience

**Consequences:**
- Mobile users temporarily leave Kajabi page view (acceptable for focused chat)
- Requires "X" close button in header (simple to implement)
- Better typing and reading experience

---

### ADR-006: Brand-Matched UI vs Generic Widget

**Status:** Accepted
**Date:** 2025-11-03

**Context:**
Widget appears on L'Agence des Copines Kajabi site with specific brand identity.

**Decision:**
Design widget to match client's brand colors and style (analyzed from lagencedescopines.mykajabi.com).

**Rationale:**
- **Professional appearance:** Looks native to the site
- **Brand consistency:** Rose #f29b9b, Brun #493f3c, 15px border-radius matches site
- **Trust:** Users feel it's part of the official site, not third-party plugin
- **Client satisfaction:** Client specifically mentioned "jolie en accord avec leur site"

**Consequences:**
- Custom CSS (not generic template)
- Accessible design (WCAG AA contrast verified)
- Warm, conversational tone matches brand voice

---

## Consistency Rules

### Date/Time Handling

**Standard:** ISO 8601 (UTC)

**Format:** `YYYY-MM-DDTHH:mm:ssZ`

**JavaScript Generation:**
```javascript
const timestamp = new Date().toISOString();
// "2025-11-03T14:30:00.123Z"
```

**Display to User:**
```javascript
// Convert to local time for display
const date = new Date(timestamp);
const displayTime = date.toLocaleTimeString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit'
});
// "14:30"
```

### UUID Generation

**Standard:** UUID v4

**JavaScript Generation:**
```javascript
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

**Or use native Crypto API:**
```javascript
const uuid = crypto.randomUUID();
```

### Error Messages (User-Facing)

**Tone:** Warm, conversational, reassuring (matches L'Agence des Copines brand)

**French Language:**
```javascript
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Oups, problème de connexion. Peux-tu réessayer ?",
  RATE_LIMIT: "Tu as envoyé beaucoup de messages ! Attends quelques instants.",
  SERVICE_ERROR: "Désolée, je rencontre un petit souci technique. Réessaie dans un instant !",
  TIMEOUT: "La réponse prend un peu de temps... Peux-tu renvoyer ton message ?",
  INVALID_MESSAGE: "Oups, ton message semble vide. Écris-moi quelque chose !"
};
```

---

## Cost Breakdown

### Monthly Operational Costs

| Service | Cost | Notes |
|---------|------|-------|
| **Hostinger VPS 4** | 30€ | 4 vCPU, 8GB RAM, 100GB SSD |
| **Supabase Pro** | 25€ | PostgreSQL + pgvector, backups |
| **Claude API** | ~40€ | Estimated 10k messages/month @ 0.003€/msg |
| **OpenAI Embeddings** | ~15€ | text-embedding-3-small @ 0.0001€/1k tokens |
| **Cohere Reranking** | ~10€ | rerank-english-v3.0 @ 0.002€/search |
| **Domain/SSL** | 0€ | Let's Encrypt free, domain assumed owned |
| **TOTAL** | **~120€** | Within budget constraint |

### Cost Optimization Strategies

1. **Rate Limiting:** Prevents abuse, caps API usage
2. **Cache Strategy:** localStorage reduces redundant API calls
3. **Efficient Prompts:** Concise system prompts reduce token usage
4. **Reranking:** Cohere reranks only top 20 (not all results)

---

## Monitoring & Observability

### Logs

**n8n Execution Logs:**
- Accessible via n8n UI: `https://chat.lagencedescopines.com/n8n/`
- Docker logs: `docker logs n8n`

**Nginx Access Logs:**
```bash
tail -f /var/log/nginx/access.log
```

**Nginx Error Logs:**
```bash
tail -f /var/log/nginx/error.log
```

### Health Checks

**Widget Health:**
```bash
curl -I https://chat.lagencedescopines.com/widget.js
# Expected: HTTP 200 OK
```

**n8n Health:**
```bash
curl https://chat.lagencedescopines.com/health
# Expected: "OK"
```

**Webhook Health:**
```bash
# Test from allowed origin
curl -X OPTIONS \
  -H "Origin: https://lagencedescopines.mykajabi.com" \
  https://chat.lagencedescopines.com/webhook/chat
# Expected: HTTP 204 with CORS headers
```

### Analytics (Optional - Post-MVP)

**Potential Metrics:**
- Total conversations started
- Messages per conversation (average)
- Agent routing distribution (Creation vs Automation)
- Response time average
- Error rate
- Most common questions (for RAG optimization)

**Implementation:** n8n workflow can log to Supabase analytics table

---

## Maintenance Guide

### Updating Widget

**Process:**
```bash
# 1. Edit locally
vim src/widget.js

# 2. Test locally
python3 -m http.server 8000

# 3. Build
./build.sh

# 4. Deploy
scp dist/widget.min.js user@vps:/var/www/chat-widget/dist/

# 5. Verify
curl -I https://chat.lagencedescopines.com/widget.js

# Users will get updated widget within 1 hour (cache expiry)
```

### Updating n8n Workflows

**Process:**
```
1. Login to n8n UI: https://chat.lagencedescopines.com/n8n/
2. Edit workflow visually
3. Test with sample data
4. Activate workflow
5. Monitor execution logs
```

### SSL Certificate Renewal

**Auto-renewal (configured):**
```bash
# Certbot auto-renews via systemd timer
sudo systemctl status certbot.timer

# Manual renewal (if needed)
sudo certbot renew
sudo systemctl reload nginx
```

### Troubleshooting

**Issue: Widget not loading on Kajabi**

Check:
```bash
# 1. Nginx serving widget?
curl -I https://chat.lagencedescopines.com/widget.js

# 2. CORS headers present?
curl -I -H "Origin: https://lagencedescopines.mykajabi.com" \
  https://chat.lagencedescopines.com/widget.js | grep Access-Control

# 3. Kajabi script tag correct?
# View Kajabi page source, verify <script src="...">
```

**Issue: Messages not sending**

Check:
```bash
# 1. n8n running?
docker ps | grep n8n

# 2. Webhook responding?
curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 3. n8n logs
docker logs n8n --tail 100
```

**Issue: Rate limiting too aggressive**

```bash
# Edit .env on VPS
sudo nano /opt/n8n/.env
# Change RATE_LIMIT_PER_MINUTE=10 to higher value

# Restart n8n
cd /opt/n8n && sudo docker-compose restart
```

---

## Next Steps

**Immediate Actions:**

1. ✅ **Architecture Review Complete** (this document)
2. ⏭️ **Provision VPS:** Set up Hostinger VPS, configure SSH access
3. ⏭️ **Configure DNS:** Point chat.lagencedescopines.com to VPS IP
4. ⏭️ **Deploy Infrastructure:** Install Docker, Nginx, n8n, SSL certificate
5. ⏭️ **Build Widget:** Develop widget.js following architecture specs
6. ⏭️ **Create n8n Workflows:** Implement message processing workflow
7. ⏭️ **Test Integration:** Test widget on local test.html, then staging Kajabi
8. ⏭️ **Deploy to Production:** Add widget script to production Kajabi site
9. ⏭️ **Monitor & Iterate:** Watch logs, gather feedback, optimize

**Success Criteria:**

- ✅ Widget loads on Kajabi without conflicts (<2s)
- ✅ Users can send messages and receive responses (<10s)
- ✅ Conversations persist across page reloads
- ✅ Mobile experience is fullscreen and keyboard-friendly
- ✅ Design matches L'Agence des Copines brand
- ✅ WCAG AA accessibility compliance
- ✅ Rate limiting prevents abuse
- ✅ All components running on single VPS
- ✅ SSL certificate active and auto-renewing
- ✅ Operational costs <120€/month

---

## Appendix

### Brand Color Palette

```css
:root {
  /* Primary Colors */
  --lac-rose-doux: #f29b9b;      /* Buttons, accents, headers */
  --lac-brun-fonce: #493f3c;     /* Text, secondary elements */

  /* Backgrounds */
  --lac-gris-clair: #f7f7f8;     /* Chat background */
  --lac-blanc: #ffffff;          /* Message bubbles */

  /* Text */
  --lac-text-dark: #333333;      /* Primary text */
  --lac-text-light: #666666;     /* Secondary text */

  /* UI */
  --lac-border-radius: 15px;     /* Consistent rounded corners */
  --lac-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);  /* Soft shadow */
}
```

### Welcome Messages (French)

```javascript
const WELCOME_MESSAGES = [
  "Salut ! Je suis l'assistante des Copines. Comment puis-je t'aider aujourd'hui ? 💕",
  "Coucou ! Besoin d'un coup de main ? Je suis là pour toi ! 🌸",
  "Hello ! Pose-moi toutes tes questions, je suis là pour t'accompagner ! ✨"
];

// Random selection
const welcomeMessage = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
```

### Typing Indicator HTML

```html
<div class="lac-typing-indicator">
  <div class="lac-typing-dot"></div>
  <div class="lac-typing-dot"></div>
  <div class="lac-typing-dot"></div>
</div>
```

```css
.lac-typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 15px;
  width: fit-content;
}

.lac-typing-dot {
  width: 8px;
  height: 8px;
  background: var(--lac-rose-doux);
  border-radius: 50%;
  animation: lac-typing-bounce 1.4s infinite ease-in-out;
}

.lac-typing-dot:nth-child(1) { animation-delay: -0.32s; }
.lac-typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes lac-typing-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
```

---

**Architecture Document Version:** 1.0
**Generated:** 2025-11-03
**Architect:** Winston (BMAD)
**Developer:** Benoit
**Status:** Ready for Implementation

---

_This architecture serves as the single source of truth for all implementation decisions. All development must follow the patterns, conventions, and specifications defined in this document._
