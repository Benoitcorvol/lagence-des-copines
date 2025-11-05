# Agent IA pour L'Agence des Copines - Epic Breakdown

**Author:** Benoit
**Date:** 2025-11-03
**Project Level:** 3
**Target Scale:** 50 concurrent users, <10s response time, <120€/month operational cost

---

## Overview

This document provides the detailed epic breakdown for Agent IA pour L'Agence des Copines, expanding on the high-level epic list in the [PRD](./PRD.md).

Each epic includes:

- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**

- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

---

## Epic 1: Infrastructure & Development Environment

**Expanded Goal:**

Establish production-ready infrastructure on Hostinger VPS with Docker, n8n, Supabase, and SSL configuration. Create local development environment for widget building. This epic delivers the foundational platform upon which all subsequent features will be built, ensuring rapid iteration during the 5-day timeline.

**Value Delivery:** Operational infrastructure ready for immediate widget and workflow deployment.

---

### Story 1.1: Provision and Configure Hostinger VPS

As a developer,
I want to provision a Hostinger VPS with Ubuntu 22.04 and install Docker,
So that I have a production environment ready for deployment.

**Acceptance Criteria:**
1. Hostinger VPS 4 provisioned (4 vCPU, 8GB RAM, 100GB SSD)
2. Ubuntu 22.04 LTS installed
3. Docker and Docker Compose installed and verified
4. SSH access configured with key-based authentication
5. Firewall configured (ports 22, 80, 443 open)
6. Server timezone set to Europe/Paris

**Prerequisites:** None (first story)

---

### Story 1.2: Configure DNS and SSL Certificate

As a developer,
I want to configure chat.lagencedescopines.com DNS and obtain SSL certificate,
So that the widget can be served securely over HTTPS.

**Acceptance Criteria:**
1. DNS A record created: chat.lagencedescopines.com → VPS IP
2. Nginx installed and running
3. Let's Encrypt SSL certificate obtained via Certbot
4. HTTPS works: `https://chat.lagencedescopines.com/health` returns 200 OK
5. Auto-renewal configured (certbot systemd timer active)
6. HTTP → HTTPS redirect configured

**Prerequisites:** Story 1.1 (VPS must exist)

---

### Story 1.3: Deploy n8n via Docker Compose

As a developer,
I want to deploy n8n in a Docker container with persistent storage,
So that I can build AI orchestration workflows.

**Acceptance Criteria:**
1. docker-compose.yml created with n8n service configuration
2. .env file created with N8N_USER, N8N_PASSWORD
3. n8n container running and accessible at `https://chat.lagencedescopines.com/n8n/`
4. n8n basic auth working (login with credentials)
5. Persistent volume mounted for workflow storage (/home/node/.n8n)
6. Webhook URL configured: `https://chat.lagencedescopines.com`

**Prerequisites:** Story 1.2 (SSL must be configured)

---

### Story 1.4: Configure Nginx Reverse Proxy

As a developer,
I want Nginx to route /webhook/ to n8n and serve static widget files,
So that the widget and backend can communicate.

**Acceptance Criteria:**
1. Nginx config created: /etc/nginx/sites-available/chat.lagencedescopines.com
2. Static file route: /widget.js → /var/www/chat-widget/dist/widget.min.js
3. Webhook proxy: /webhook/* → n8n (127.0.0.1:5678)
4. Admin proxy: /n8n/ → n8n admin interface
5. CORS headers configured for Kajabi origin
6. GZIP compression enabled for widget.js
7. Health check endpoint: /health returns "OK"

**Prerequisites:** Story 1.3 (n8n must be running)

---

### Story 1.5: Create Supabase Project and Database Schema

As a developer,
I want a Supabase PostgreSQL database with pgvector extension,
So that I can store conversations and RAG embeddings.

**Acceptance Criteria:**
1. Supabase project created (Pro tier, ~25€/month)
2. pgvector extension enabled
3. Tables created: users, conversations, messages, documents, document_chunks
4. Vector index created on document_chunks.embedding (ivfflat, cosine similarity)
5. RLS policies configured (permissive for MVP - service key usage)
6. Connection tested from n8n (Supabase credentials in .env)
7. Database migration SQL files saved to /docs/migrations/

**Prerequisites:** None (independent service)

---

### Story 1.6: Setup Local Widget Development Environment

As a developer,
I want a local development environment with build tools,
So that I can develop and test the widget locally before deployment.

**Acceptance Criteria:**
1. Project structure created: /var/www/chat-widget/{src,dist,test}
2. package.json created with Terser dependency
3. Build script created: build.sh (minifies src/widget.js → dist/widget.min.js)
4. test.html created for local browser testing
5. Local Python HTTP server documented (python3 -m http.server 8000)
6. README.md with setup instructions
7. .gitignore configured (node_modules, dist/*.map)

**Prerequisites:** Story 1.1 (VPS access for deployment testing)

---

## Epic 2: Chat Widget UI

**Expanded Goal:**

Build a lightweight, brand-matched chat widget using Vanilla JavaScript and Shadow DOM that embeds seamlessly in Kajabi without conflicts. The widget handles all user-facing interaction: displaying messages, managing conversation state, and communicating with the n8n backend. Optimized for <50kb bundle size and <2s load time.

**Value Delivery:** Fully functional chat interface ready for Kajabi embedding.

---

### Story 2.1: Create Widget Foundation with Shadow DOM

As a developer,
I want a Web Component with Shadow DOM encapsulation,
So that the widget styles don't conflict with Kajabi.

**Acceptance Criteria:**
1. widget.js created with IIFE wrapping
2. Custom element defined: `<lac-chat-widget>`
3. Shadow DOM attached (mode: 'open')
4. Auto-injection on DOMContentLoaded
5. All CSS scoped with .lac- prefix
6. Test in test.html - no style leakage to parent page
7. Basic structure renders: container div visible

**Prerequisites:** Story 1.6 (dev environment ready)

---

### Story 2.2: Implement Floating Button UI

As a user,
I want to see a floating chat button in the bottom-right corner,
So that I can open the chat interface.

**Acceptance Criteria:**
1. Floating button rendered: 60x60px, bottom-right (20px margins)
2. Brand color applied: background #f29b9b (rose)
3. Icon displayed: chat bubble SVG (white color)
4. Hover effect: subtle scale animation (1.05x)
5. Click opens chat interface (toggle)
6. Accessibility: ARIA label "Ouvrir le chat", keyboard focusable
7. Mobile responsive: visible on all screen sizes

**Prerequisites:** Story 2.1 (Shadow DOM foundation)

---

### Story 2.3: Build Desktop Chat Popup Interface

As a user,
I want a popup chat window when I click the button on desktop,
So that I can have a conversation without leaving the page.

**Acceptance Criteria:**
1. Chat container: 400x600px popup, positioned bottom-right
2. Slide-up animation on open (300ms CSS transition)
3. Header: "L'Agence des Copines" title + close button (X)
4. Messages area: scrollable div with #f7f7f8 background
5. Input area: textarea + send button (fixed at bottom)
6. Close button click → popup closes, button remains visible
7. Visual design matches brand (rose/brun colors, 15px border-radius)

**Prerequisites:** Story 2.2 (floating button exists)

---

### Story 2.4: Implement Mobile Fullscreen Mode

As a mobile user,
I want the chat to open fullscreen on my phone,
So that I have maximum space for conversation.

**Acceptance Criteria:**
1. Media query: @media (max-width: 767px)
2. Fullscreen overlay: 100vw x 100vh, slide-up from bottom
3. Header with close button (X) - fixed at top
4. Messages area: flexible height, scrollable
5. Input area: fixed at bottom, keyboard-friendly (viewport height adapts)
6. Messages stay visible above keyboard when focused
7. Smooth transitions on open/close

**Prerequisites:** Story 2.3 (desktop popup exists)

---

### Story 2.5: Implement Message Send/Receive UI

As a user,
I want to type messages and see them displayed in the chat,
So that I can have a visual conversation.

**Acceptance Criteria:**
1. User types in textarea (max 2000 characters, counter displayed)
2. Send button click OR Enter key → message sent
3. User message bubble: right-aligned, rose background (#f29b9b), white text
4. Bot message bubble: left-aligned, white background, dark text (#333)
5. Messages auto-scroll to bottom on new message
6. Empty message blocked (send button disabled if textarea empty)
7. Timestamp displayed below each message (HH:MM format)

**Prerequisites:** Story 2.4 (UI layout exists)

---

### Story 2.6: Add Typing Indicator Animation

As a user,
I want to see a typing indicator when the bot is processing,
So that I know my message was received.

**Acceptance Criteria:**
1. Typing indicator component: 3 animated dots (rose color)
2. Appears immediately when user sends message
3. CSS animation: bouncing dots (stagger delay)
4. Positioned as bot message bubble (left-aligned)
5. Removed when bot response received
6. Accessible: aria-live="polite" region announces "Assistant is typing"

**Prerequisites:** Story 2.5 (message UI exists)

---

### Story 2.7: Implement localStorage Persistence

As a user,
I want my conversation to persist when I refresh the page,
So that I don't lose my chat history.

**Acceptance Criteria:**
1. On first visit: generate UUID for userId (lac_user_id)
2. On first message: generate UUID for conversationId (lac_conversation_id)
3. Save to localStorage: userId, conversationId, messages array
4. On page load: restore conversation from localStorage if exists
5. Messages render from cache instantly (<100ms)
6. Cache timestamp stored (lac_cache_timestamp)
7. Cache expires after 5 minutes (fresh fetch from backend if older)

**Prerequisites:** Story 2.5 (message UI exists)

---

### Story 2.8: Implement Error Handling UI

As a user,
I want clear error messages when something fails,
So that I know what to do next.

**Acceptance Criteria:**
1. Network error → Show: "Oups, problème de connexion. Peux-tu réessayer ?"
2. Timeout error → Show: "La réponse prend un peu de temps... Peux-tu renvoyer ton message ?"
3. Rate limit → Show: "Tu as envoyé beaucoup de messages ! Attends quelques instants."
4. Error message displayed as bot bubble (yellow/orange background for visibility)
5. Retry button displayed below error message
6. Retry button click → resend last user message
7. Auto-retry once (silent, 2s delay) before showing error

**Prerequisites:** Story 2.5 (message UI exists)

---

### Story 2.9: Implement API Communication to n8n

As a developer,
I want the widget to send messages to n8n webhook and receive responses,
So that the chat can communicate with the AI backend.

**Acceptance Criteria:**
1. POST to https://chat.lagencedescopines.com/webhook/chat
2. Request body: {conversationId, userId, message, timestamp (ISO 8601)}
3. Content-Type: application/json
4. Timeout: 15 seconds (AbortSignal)
5. Success (200) → Parse response, display bot message
6. Error (4xx, 5xx) → Trigger error handling (Story 2.8)
7. Response format validated: {response, agentType, conversationId, timestamp}

**Prerequisites:** Story 2.8 (error handling ready), Epic 1 complete (n8n deployed)

---

### Story 2.10: Build and Deploy Production Widget

As a developer,
I want a minified, production-ready widget bundle,
So that it loads quickly on Kajabi (<2s).

**Acceptance Criteria:**
1. Run build.sh → Terser minifies src/widget.js
2. Output: dist/widget.min.js + dist/widget.js.map
3. Bundle size: <50kb gzipped (verify with gzip -c widget.min.js | wc -c)
4. Source map generated for debugging
5. Upload to VPS: /var/www/chat-widget/dist/
6. Nginx serves at https://chat.lagencedescopines.com/widget.js
7. Test in browser: script loads in <2 seconds

**Prerequisites:** All Epic 2 stories complete

---

### Story 2.11: Create Kajabi Integration Script

As a site owner,
I want simple instructions to embed the widget in Kajabi,
So that I can activate the chatbot.

**Acceptance Criteria:**
1. README.md created with integration instructions
2. Kajabi embed code: `<script src="https://chat.lagencedescopines.com/widget.js" async></script>`
3. Instructions: Add to Site Settings → Custom Code → Footer
4. Screenshot/video tutorial created (optional but helpful)
5. Tested on staging Kajabi site
6. No visual conflicts observed with Kajabi theme
7. Widget loads and functions correctly on Kajabi

**Prerequisites:** Story 2.10 (production widget deployed)

---

## Epic 3: n8n AI Orchestration Backend

**Expanded Goal:**

Implement the intelligent heart of the system: n8n workflows that receive messages, route to specialized agents (Creation/Automation), query RAG knowledge base, call Claude API, detect conversation loops, and persist data. This epic delivers the AI orchestration layer that makes the chatbot intelligent and context-aware.

**Value Delivery:** Fully functional AI backend with dual-agent routing and RAG integration.

---

### Story 3.1: Create Main Webhook Endpoint Workflow

As a developer,
I want an n8n webhook that receives messages from the widget,
So that I can start processing conversations.

**Acceptance Criteria:**
1. New n8n workflow created: "Message Processing"
2. Webhook node added: POST /webhook/chat
3. Input validation node: check conversationId, userId, message, timestamp
4. Invalid input → Return 400 error with message
5. Valid input → Extract variables, pass to next node
6. Test with curl: successful 200 response
7. Workflow activated and saved

**Prerequisites:** Story 1.3 (n8n deployed)

---

### Story 3.2: Implement Rate Limiting Logic

As a system,
I want to limit users to 10 messages per minute,
So that API costs stay under budget and abuse is prevented.

**Acceptance Criteria:**
1. Supabase query node: count messages from conversationId in last 60 seconds
2. If count >= 10 → Return 429 error: "Trop de messages envoyés. Attendez quelques instants."
3. If count < 10 → Continue workflow
4. Rate limit configurable via environment variable (RATE_LIMIT_PER_MINUTE)
5. Test: Send 11 messages rapidly → 11th returns 429
6. Counter resets after 60 seconds

**Prerequisites:** Story 3.1 (webhook exists), Story 1.5 (Supabase connected)

---

### Story 3.3: Load Conversation History from Supabase

As a developer,
I want to load the last 10 messages from a conversation,
So that the AI has context for generating responses.

**Acceptance Criteria:**
1. Supabase query node: SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT 10
2. Results reversed (oldest first for context)
3. Format as array: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
4. Empty conversation → Return empty array (first message)
5. History passed to next node as context variable
6. Test: Create conversation with 15 messages → Only last 10 loaded

**Prerequisites:** Story 3.1 (webhook exists), Story 1.5 (Supabase schema ready)

---

### Story 3.4: Implement Keyword Router for Agent Selection

As a system,
I want to analyze the user's message and route to the appropriate agent,
So that users get specialized expertise.

**Acceptance Criteria:**
1. Switch/Router node in n8n workflow
2. Creation keywords: ["création", "contenu", "instagram", "branding", "post", "réseaux sociaux"]
3. Automation keywords: ["automatisation", "tunnel", "vente", "technique", "email", "funnel"]
4. Case-insensitive matching
5. If Creation keywords found → Route to Creation Agent branch
6. If Automation keywords found → Route to Automation Agent branch
7. Default (no match) → Route to Creation Agent (friendly fallback)
8. Test both branches with sample messages

**Prerequisites:** Story 3.3 (history loaded)

---

### Story 3.5: Create Creation Agent Workflow Branch

As a user asking about content creation,
I want responses from an expert in Instagram strategy and branding,
So that I get specialized guidance.

**Acceptance Criteria:**
1. Creation Agent prompt node created in workflow
2. System prompt: "Tu es un expert en création de contenu pour L'Agence des Copines. Tu aides les professionnels du bien-être à développer leur stratégie Instagram, créer du contenu engageant, et construire leur marque."
3. Prompt includes: conversation history + RAG results (placeholder for now) + user message
4. Variables injected: {{conversation_history}}, {{rag_results}}, {{user_message}}
5. Tone: Warm, conversational, French "tu" form
6. Agent type saved as metadata: "creation"

**Prerequisites:** Story 3.4 (router exists)

---

### Story 3.6: Create Automation Agent Workflow Branch

As a user asking about automation,
I want responses from an expert in sales funnels and technical tools,
So that I get specialized technical guidance.

**Acceptance Criteria:**
1. Automation Agent prompt node created in workflow
2. System prompt: "Tu es un expert en automatisation et tunnels de vente pour L'Agence des Copines. Tu aides les professionnels du bien-être à configurer leurs funnels, automatiser leur marketing, et optimiser leurs outils techniques."
3. Prompt includes: conversation history + RAG results (placeholder for now) + user message
4. Variables injected: {{conversation_history}}, {{rag_results}}, {{user_message}}
5. Tone: Clear, actionable, French "tu" form
6. Agent type saved as metadata: "automation"

**Prerequisites:** Story 3.4 (router exists)

---

### Story 3.7: Integrate Claude API

As a developer,
I want to send prompts to Claude and receive AI-generated responses,
So that the chatbot can answer user questions.

**Acceptance Criteria:**
1. HTTP Request node configured for Anthropic API
2. Endpoint: https://api.anthropic.com/v1/messages
3. Headers: x-api-key (from .env), anthropic-version: 2023-06-01
4. Model: claude-3-5-sonnet-20241022
5. Max tokens: 1000, Temperature: 0.7
6. Request body: system prompt + messages array
7. Response parsed: extract content[0].text
8. Error handling: timeout (30s), API errors (return fallback message)
9. Test: Send sample prompt → Receive response

**Prerequisites:** Story 3.5 or 3.6 (agent prompts exist), ANTHROPIC_API_KEY in .env

---

### Story 3.8: Implement RAG Query Pipeline (Placeholder)

As a system,
I want to query the knowledge base for relevant content,
So that AI responses are grounded in L'Agence des Copines materials.

**Acceptance Criteria:**
1. Placeholder node added to workflow: "RAG Query (Placeholder)"
2. TODO: Generate embedding for user message (OpenAI API)
3. TODO: Query Supabase pgvector for top 20 similar chunks
4. TODO: Rerank with Cohere API to top 3
5. For now: Return empty string (will be implemented in Epic 4)
6. Workflow continues without RAG (agent responds without knowledge base context)
7. Variable {{rag_results}} set to empty string

**Prerequisites:** Story 3.5 and 3.6 (agents exist)

**Note:** Full RAG implementation in Epic 4 (Story 4.4)

---

### Story 3.9: Implement Loop Detection Logic

As a system,
I want to detect when users are asking repetitive questions,
So that I can trigger upsell opportunities.

**Acceptance Criteria:**
1. Count user messages in conversation history
2. If user message count >= 6 in last 10 messages → Trigger loop check
3. Calculate semantic similarity between last 3 user messages (simple keyword overlap for MVP)
4. If similarity score >= 0.8 → Set loop_detected = true
5. If loop detected → Append upsell message: "Tu as beaucoup de questions approfondies ! 🎉 Notre formation [Topic] Pro pourrait t'intéresser pour un accompagnement personnalisé."
6. Flag conversation in database (update conversations.status = 'upsell_opportunity')
7. Test: Send 6 similar questions → Upsell message appears

**Prerequisites:** Story 3.3 (history loaded)

---

### Story 3.10: Save Messages to Supabase

As a system,
I want to persist user and bot messages in the database,
So that conversation history is preserved.

**Acceptance Criteria:**
1. Save user message: INSERT INTO messages (conversation_id, role, content, timestamp)
2. Save bot response: INSERT INTO messages (conversation_id, role, content, agent_type, timestamp)
3. Update conversations.last_message_at = current timestamp
4. Create conversation record if new (first message)
5. All database writes succeed before returning response
6. Transaction rollback on error (prevent partial saves)
7. Test: Send message → Verify both user and bot messages in database

**Prerequisites:** Story 3.7 (Claude response generated), Story 1.5 (Supabase schema)

---

### Story 3.11: Return Response to Widget

As a developer,
I want n8n to return a properly formatted JSON response to the widget,
So that the bot message displays correctly.

**Acceptance Criteria:**
1. Response format: {response: string, agentType: string, conversationId: string, timestamp: string}
2. HTTP 200 status code
3. Content-Type: application/json
4. Response includes full bot message text
5. Timestamp in ISO 8601 format
6. CORS headers included (Access-Control-Allow-Origin)
7. Test end-to-end: Widget sends message → n8n returns response → Widget displays

**Prerequisites:** Story 3.10 (messages saved)

---

### Story 3.12: Test and Optimize Workflow Performance

As a developer,
I want the workflow to complete in <8 seconds,
So that the user experience meets the <10s requirement.

**Acceptance Criteria:**
1. Workflow execution time measured in n8n logs
2. Average time: <8 seconds (buffer for network latency)
3. Bottlenecks identified: Claude API call, database queries
4. Parallel execution where possible (e.g., save messages while formatting response)
5. Timeout handling: If Claude API >25s → Return error, don't block workflow
6. Load test: 10 concurrent requests → All complete in <10s
7. Performance documentation created

**Prerequisites:** All Epic 3 stories complete

---

## Epic 4: RAG Knowledge Base & Testing

**Expanded Goal:**

Implement multi-format document ingestion pipeline to populate the knowledge base with L'Agence des Copines training materials. Integrate full RAG query into n8n workflow (replacing placeholder from Story 3.8). Conduct end-to-end testing, optimize performance, and deploy to production with monitoring.

**Value Delivery:** Production-ready system with intelligent, knowledge-grounded responses.

---

### Story 4.1: Create Document Ingestion Script (Multi-Format)

As a developer,
I want a Python script that processes PDF, Excel, images, text, and Word documents,
So that I can upload client content to the knowledge base.

**Acceptance Criteria:**
1. Python script: ingest_documents.py
2. Dependencies: pdfplumber, pandas, pytesseract, python-docx, openai
3. Format detection: Auto-detect file type by extension
4. PDF extraction: pdfplumber extracts text
5. Excel extraction: pandas reads all sheets, concatenates cells
6. Image extraction: Tesseract OCR on .jpg/.png
7. Text/Markdown: Direct read
8. Word extraction: python-docx extracts paragraphs
9. Usage: `python ingest_documents.py --file path/to/document.pdf`
10. Error handling: Log errors, continue processing other files

**Prerequisites:** Story 1.5 (Supabase schema ready)

---

### Story 4.2: Implement Text Chunking and Embedding Generation

As a developer,
I want extracted text split into chunks with embeddings,
So that RAG queries can find relevant sections.

**Acceptance Criteria:**
1. Chunk size: 500 tokens (using tiktoken library)
2. Chunk overlap: 50 tokens
3. Preserve sentence boundaries (don't split mid-sentence)
4. Generate embeddings: OpenAI text-embedding-3-small API
5. Embedding dimensions: 1536
6. Batch processing: 100 chunks per API call (cost optimization)
7. Progress indicator: Show "Processing chunk X of Y"
8. Error handling: Retry failed embedding requests (3 attempts)

**Prerequisites:** Story 4.1 (text extracted)

---

### Story 4.3: Save Chunks and Embeddings to Supabase pgvector

As a developer,
I want document chunks stored with vector embeddings in Supabase,
So that I can perform similarity searches.

**Acceptance Criteria:**
1. Insert into documents table: {filename, file_type, upload_date, uploaded_by: 'benoit'}
2. Insert into document_chunks table: {document_id, content, embedding, chunk_index}
3. Bulk insert for performance (batch of 50 chunks)
4. Verify vector index exists: ivfflat on embedding column
5. Test similarity search: SELECT * FROM document_chunks ORDER BY embedding <=> query_embedding LIMIT 20
6. Metadata saved: document source, upload timestamp
7. Duplicate prevention: Skip if filename already exists

**Prerequisites:** Story 4.2 (embeddings generated), Story 1.5 (pgvector enabled)

---

### Story 4.4: Implement Full RAG Query in n8n Workflow

As a system,
I want to query the knowledge base for relevant content during conversations,
So that AI responses are grounded in client materials.

**Acceptance Criteria:**
1. Replace placeholder RAG node from Story 3.8
2. Step 1: Generate query embedding (OpenAI API call from n8n)
3. Step 2: Supabase pgvector query (cosine similarity, top 20 chunks)
4. Step 3: Rerank with Cohere API (rerank-english-v3.0, return top 3)
5. Step 4: Format results as context string (concatenate chunk content)
6. Inject {{rag_results}} into agent prompts
7. Test: Ask "Comment créer du contenu Instagram?" → Response includes specific content from uploaded ebook
8. Error handling: If RAG fails → Continue without context (graceful degradation)

**Prerequisites:** Story 4.3 (knowledge base populated), Story 3.8 (placeholder exists)

---

### Story 4.5: Upload Initial Client Content

As Benoit,
I want to upload L'Agence des Copines ebooks and training materials,
So that the chatbot can answer questions about their content.

**Acceptance Criteria:**
1. Gather client materials: ebooks (PDF), formations (docs/Excel)
2. Run ingestion script on each file: `python ingest_documents.py --file [path]`
3. Verify uploads in Supabase: Check documents and document_chunks tables
4. Minimum 5 documents uploaded (mix of PDF, Excel, docs)
5. Total chunks: ~500+ (sufficient for meaningful RAG responses)
6. Test queries: Sample questions about uploaded content return relevant results
7. Document inventory created: List of uploaded files with metadata

**Prerequisites:** Story 4.3 (ingestion script ready)

---

### Story 4.6: End-to-End Integration Testing

As a QA tester,
I want to test the complete user flow from widget to AI response,
So that I verify all components work together.

**Acceptance Criteria:**
1. Test Case 1: First-time user sends Creation question → Response in <10s
2. Test Case 2: Returning user conversation persists across page reload
3. Test Case 3: Mobile fullscreen mode works on iPhone/Android
4. Test Case 4: Rate limiting triggers after 10 messages
5. Test Case 5: Loop detection triggers upsell after 6 similar messages
6. Test Case 6: RAG returns relevant content from knowledge base
7. Test Case 7: Error handling works (network disconnect, retry)
8. All tests documented in test-cases.md

**Prerequisites:** All Epic 2 and Epic 3 stories complete, Story 4.4 (RAG integrated)

---

### Story 4.7: Performance Optimization and Load Testing

As a developer,
I want to verify the system handles 50 concurrent users,
So that performance requirements are met.

**Acceptance Criteria:**
1. Load testing tool setup (Apache Bench or k6)
2. Test: 50 concurrent requests to /webhook/chat
3. All requests complete in <10 seconds
4. No errors or dropped connections
5. Database connection pool sized appropriately (min 10, max 50)
6. n8n workflow queue handles concurrency (100 max executions)
7. Bottlenecks identified and resolved (cache frequently accessed data)
8. Load test results documented

**Prerequisites:** Story 4.6 (integration testing complete)

---

### Story 4.8: Production Deployment and Go-Live

As a product owner,
I want the chatbot live on the production Kajabi site,
So that users can start using it.

**Acceptance Criteria:**
1. Widget script added to Kajabi production site footer
2. Test on production: Widget loads, conversation works end-to-end
3. Monitor n8n logs: No errors in first hour
4. Monitor Supabase: Messages being saved correctly
5. Monitor API costs: Stay within budget (~65€ estimated)
6. Backup created: Database snapshot, n8n workflows exported
7. Rollback plan documented (remove script tag if critical issue)
8. Go-live announcement to L'Agence des Copines team

**Prerequisites:** Story 4.7 (performance verified)

---

### Story 4.9: Create Monitoring and Maintenance Documentation

As Benoit,
I want clear documentation for monitoring and maintaining the system,
So that I can manage it without ongoing developer help.

**Acceptance Criteria:**
1. Monitoring guide: How to check n8n logs, Supabase metrics, uptime
2. Troubleshooting guide: Common issues and solutions
3. Maintenance guide: How to upload new documents, update agent prompts
4. Cost tracking: How to monitor monthly API usage
5. SSL renewal: Certbot auto-renewal verification
6. Backup strategy: Database snapshots, n8n workflow exports
7. Contact information: Who to call if critical issues arise
8. Documentation saved to /docs/maintenance-guide.md

**Prerequisites:** Story 4.8 (production deployed)

---

## Story Guidelines Reference

**Story Format:**

```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**

- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

**For implementation:** Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown.
