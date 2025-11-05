# Agent IA pour L'Agence des Copines Product Requirements Document (PRD)

**Author:** Benoit
**Date:** 2025-11-03
**Project Level:** 3
**Target Scale:** 50 concurrent users, <10s response time, <120€/month operational cost

---

## Goals and Background Context

### Goals

- Deliver production-ready AI chatbot with Kajabi-embeddable widget
- n8n handles all AI orchestration: intelligent routing, dual-agent system (Creation/Automation), RAG queries, and Claude API integration
- Widget provides simple UI: send messages, display responses, persist conversations
- Support 50 concurrent users with <10s response time
- Maintain <120€/month operational cost
- Complete deployment within 5-day timeline and 2,500€ budget

### Background Context

L'Agence des Copines needs an AI assistant to support their wellness professionals with two key areas: content creation (Instagram strategy, branding) and marketing automation (sales funnels, technical tools). The current challenge is scaling personalized support without increasing overhead costs.

The system must integrate seamlessly into their existing Kajabi platform, maintain their warm brand voice, and provide instant access to their extensive knowledge base (ebooks, training materials). The architecture leverages n8n for orchestration, Supabase for data/RAG, and Claude API for conversational AI, optimized for rapid 5-day development and cost-effective operation (<120€/month).

---

## Requirements

### Functional Requirements

#### Chat Widget (Frontend)

**FR001:** Widget must embed in Kajabi via single script tag without CSS/JS conflicts (Shadow DOM isolation)

**FR002:** Widget displays floating button (bottom-right, 60x60px, brand colors) that opens chat interface

**FR003:** Chat interface opens as 400x600px popup on desktop, fullscreen on mobile (<768px)

**FR004:** Users can send text messages via send button or Enter key (max 2000 characters)

**FR005:** Widget displays bot responses with typing indicator during processing

**FR006:** Conversations persist across page reloads using localStorage (conversationId, userId)

**FR007:** Widget auto-generates anonymous UUID for new users on first visit

**FR008:** Widget displays error messages with retry option on API failures

**FR009:** Widget implements 5-minute message cache to reduce API calls

#### n8n Backend Orchestration

**FR010:** n8n webhook receives messages from widget (conversationId, userId, message, timestamp)

**FR011:** n8n loads last 10 messages from conversation history (Supabase)

**FR012:** Keyword router analyzes message and routes to Creation Agent OR Automation Agent

**FR013:** Creation Agent handles: "création", "contenu", "instagram", "branding" keywords

**FR014:** Automation Agent handles: "automatisation", "tunnel", "vente", "technique" keywords

**FR015:** RAG query generates embedding, searches pgvector (top 20), reranks with Cohere (top 3)

**FR016:** n8n assembles context: conversation history + RAG results + agent-specific prompt

**FR017:** n8n calls Claude API (claude-3-5-sonnet, max 1000 tokens, temp 0.7)

**FR018:** Loop detection identifies circular conversations (>6 messages, >0.8 similarity) and triggers upsell

**FR019:** n8n saves user message and bot response to Supabase messages table

**FR020:** n8n returns JSON response to widget (response, agentType, conversationId, timestamp)

#### RAG Knowledge Base

**FR021:** System ingests PDF documents and extracts text with pdfplumber

**FR022:** System ingests Excel files (.xlsx, .xls) and concatenates cells with pandas

**FR023:** System ingests images (.jpg, .png) and extracts text via OCR (Tesseract)

**FR024:** System ingests text files (.txt, .md) and Word documents (.docx)

**FR025:** System chunks documents (500 tokens, 50 overlap, preserve sentence boundaries)

**FR026:** System generates embeddings using OpenAI text-embedding-3-small (1536 dimensions)

**FR027:** System stores document chunks with embeddings in Supabase pgvector table

#### Security & Rate Limiting

**FR028:** n8n enforces rate limit: max 10 messages per minute per conversationId

**FR029:** n8n validates message length (1-2000 characters) and UUID formats

**FR030:** Nginx serves widget with CORS headers allowing Kajabi origin only

### Non-Functional Requirements

**NFR001:** System must support 50 concurrent users without performance degradation

**NFR002:** Widget load time must be <2 seconds on first render

**NFR003:** End-to-end message response time must be <10 seconds (widget → n8n → Claude → widget)

**NFR004:** System must maintain 99% uptime target with graceful degradation if external APIs fail

**NFR005:** Total monthly operational cost must remain under 120€ (VPS 30€ + Supabase 25€ + APIs ~65€)

**NFR006:** Widget bundle size must be <50kb minified and gzipped

**NFR007:** System must be deployable within 5-day timeline with 2,500€ development budget

**NFR008:** Widget must be maintainable by Benoit without ongoing developer intervention (n8n visual workflows, simple deployment)

---

## User Journeys

### Journey 1: First-Time User - Content Creation Question (Happy Path)

**Persona:** Sophie, wellness professional, needs Instagram content strategy help

1. Sophie visits L'Agence des Copines Kajabi course page
2. Notices floating chat button (bottom-right, rose color)
3. Clicks button → Chat popup opens (400x600px on desktop)
4. Sees welcome message: "Salut ! Je suis l'assistante des Copines. Comment puis-je t'aider aujourd'hui ? 💕"
5. Types: "Comment créer du contenu Instagram engageant pour mon cabinet de naturopathie?"
6. Clicks send → Typing indicator appears (animated dots)
7. **n8n receives message → Router detects "contenu" + "Instagram" → Routes to Creation Agent**
8. **Creation Agent queries RAG (finds Instagram training materials) → Claude generates response**
9. Response appears after 6 seconds: Actionable Instagram strategy with 3-4 bullet points
10. Sophie reads response, satisfied
11. Conversation persists → Sophie navigates to another Kajabi page → Widget remembers conversation
12. Later returns, asks follow-up question → Same conversationId, history loads instantly

**Success Criteria:** Zero-friction onboarding, intelligent routing, instant persistence

---

### Journey 2: Returning User - Automation Question with Loop Detection

**Persona:** Marc, has asked multiple similar questions about sales funnels

1. Marc opens Kajabi site → Widget auto-loads his existing conversation (localStorage)
2. Types: "Comment automatiser mon tunnel de vente Kajabi?"
3. **n8n routes to Automation Agent** (keyword: "automatiser", "tunnel")
4. Receives detailed funnel automation guide
5. Asks follow-up: "Et pour l'email automation?"
6. Receives response about email sequences
7. Asks 3rd question: "Comment intégrer avec mon CRM?" (still about automation)
8. Asks 4th similar question: "Quelle automatisation choisir pour convertir?"
9. **n8n Loop Detection activates** (>6 messages, semantic similarity >0.8)
10. Bot responds with helpful answer + upsell message: "Tu as beaucoup de questions approfondies ! 🎉 Notre formation Automatisation Pro pourrait t'intéresser pour un accompagnement personnalisé."
11. Marc receives personalized upsell, conversation flagged for L'Agence review

**Success Criteria:** Multi-turn conversation, intelligent loop detection, revenue opportunity identification

---

### Journey 3: Mobile User - Error Recovery

**Persona:** Julie, on mobile phone, unstable connection

1. Julie browses Kajabi site on iPhone (Safari)
2. Taps floating button → **Fullscreen chat opens** (mobile optimization)
3. Types question about branding
4. Network drops → Message fails to send
5. **Widget shows error**: "Oups, problème de connexion. Peux-tu réessayer ?"
6. **Auto-retry after 2 seconds** (silent recovery)
7. Still fails → Shows manual "Réessayer" button
8. Julie taps retry → Message sends successfully
9. Typing indicator appears
10. Response loads → Fullscreen chat displays response
11. Julie scrolls conversation history (keyboard-friendly, messages stay visible above keyboard)
12. Taps "X" close button → Returns to Kajabi page, conversation saved

**Success Criteria:** Mobile-optimized UX, graceful error handling, retry logic

---

## UX Design Principles

**1. Zero-Friction Engagement**
- No signup required (anonymous UUID)
- Single-click access via floating button
- Conversations persist automatically across pages
- Mobile-first responsive design

**2. Brand Consistency**
- Match L'Agence des Copines warm, conversational tone
- Visual alignment with existing Kajabi site
- Friendly French language ("tu" form, emojis)
- Professional yet approachable

**3. Accessibility-First (WCAG AA Compliance)**
- Keyboard navigation support (Tab, Enter, Esc)
- ARIA labels for screen readers
- 4.5:1 minimum contrast ratio
- Focus indicators on interactive elements

**4. Graceful Error Handling**
- Clear, warm error messages in French
- Auto-retry with manual fallback
- No lost messages (localStorage backup)
- Reassuring feedback during failures

---

## User Interface Design Goals

**Visual Design:**
- **Primary Color:** Rose #f29b9b (buttons, accents, brand recognition)
- **Secondary Color:** Brun #493f3c (text, headers)
- **Background:** Gris clair #f7f7f8 (chat area)
- **Border Radius:** 15px (consistent rounded corners, matches site)

**Layout & Interaction:**
- **Desktop:** 400x600px popup, bottom-right position
- **Mobile:** Fullscreen overlay (<768px breakpoint)
- **Typing Indicator:** Animated dots bubble (rose color)
- **Message Bubbles:** User (right-aligned, rose), Bot (left-aligned, white)

**Performance:**
- Smooth animations (CSS transitions, 300ms)
- Optimized bundle (<50kb gzipped)
- Instant UI feedback (no perceived lag)

---

## Epic List

### Epic 1: Infrastructure & Development Environment
**Goal:** Establish foundational infrastructure and deployment pipeline for rapid development

**Estimated Stories:** 5-7 stories

**Delivers:**
- VPS provisioned and configured (Docker, Nginx, SSL)
- Supabase database with pgvector schema
- n8n deployed and accessible
- Domain/DNS configured (chat.lagencedescopines.com)
- Development environment ready for widget and workflow building

---

### Epic 2: Chat Widget UI
**Goal:** Build embeddable Kajabi widget with brand-matched UI and core chat functionality

**Estimated Stories:** 8-10 stories

**Delivers:**
- Vanilla JS widget with Shadow DOM isolation
- Floating button with brand colors
- Desktop popup (400x600px) and mobile fullscreen
- Message send/receive UI
- Typing indicator and error handling
- localStorage persistence (conversationId, userId)
- Minified production build (<50kb)
- Kajabi integration script

---

### Epic 3: n8n AI Orchestration Backend
**Goal:** Implement intelligent routing, dual-agent system, RAG pipeline, and Claude integration

**Estimated Stories:** 10-12 stories

**Delivers:**
- Webhook endpoint for widget messages
- Keyword router (Creation vs Automation agents)
- Creation Agent workflow with specialized prompt
- Automation Agent workflow with specialized prompt
- RAG query pipeline (embed → pgvector → rerank)
- Claude API integration
- Conversation history management
- Loop detection logic
- Rate limiting and validation
- Database persistence (messages, conversations)

---

### Epic 4: RAG Knowledge Base & Testing
**Goal:** Implement multi-format document ingestion and end-to-end system testing

**Estimated Stories:** 6-8 stories

**Delivers:**
- Document ingestion script (PDF, Excel, images, text, Word)
- Text chunking and embedding generation
- pgvector storage and indexing
- Initial content upload (client's ebooks/formations)
- End-to-end integration testing
- Performance optimization (<10s response time)
- Production deployment and Kajabi go-live
- Monitoring and maintenance documentation

> **Note:** Detailed epic breakdown with full story specifications is available in [epics.md](./epics.md)

---

## Out of Scope

**Authentication & User Management (V1):**
- Email/password login system
- User profiles and account management
- Email capture forms within widget
- Admin dashboard for user management

**Advanced Features:**
- Streaming responses (real-time token-by-token display)
- Voice input/output capabilities
- Multi-language support (French only in V1)
- Conversation export (PDF, email transcripts)
- Custom widget branding per client

**Analytics & Reporting:**
- Built-in analytics dashboard
- Conversation sentiment analysis
- A/B testing framework
- Advanced reporting (beyond basic n8n logs)

**Integration Extensions:**
- CRM integrations (HubSpot, Salesforce)
- Calendar booking within chat
- Payment processing in chat
- Third-party tool integrations beyond Kajabi

**Mobile Apps:**
- Native iOS/Android applications
- Push notifications
- Offline mode with sync

**Content Management:**
- Admin UI for document upload (manual process via Benoit in V1)
- Visual RAG content editor
- Automated content crawling/scraping
- Version control for knowledge base

**Platform Extensions:**
- Embedding on platforms other than Kajabi
- White-label solution for resale
- Multi-tenant architecture

**Future Enhancements (Post-V1):**
- Email capture after X messages
- Lead qualification scoring
- Conversation handoff to human support
- Advanced loop detection with ML
- Cost optimization with response caching
