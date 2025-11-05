# Technical Specification: Agent IA pour L'Agence des Copines

**Date:** 2025-11-03
**Developer:** Benoit (CTO)
**Client:** L'Agence des Copines
**Timeline:** 5 days
**Budget:** 2,500€
**Status:** Draft for Architecture Review

---

## Executive Summary

Deliverable: Production-ready AI chatbot system with Kajabi-embeddable widget, n8n orchestration backend, RAG knowledge base supporting multi-format ingestion (PDF, Excel, images, text, docs), dual-agent intelligent routing, and Hostinger VPS deployment.

**Core Technical Challenge:** Build modular system with clean separation (Widget UI ↔ n8n Backend ↔ Supabase Database ↔ External APIs) that processes 50 concurrent users with <10s response time at <120€/month operational cost.

---

## System Architecture Overview

**4-Layer Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Frontend Widget (Kajabi Embed)                    │
│ - Intercom-style floating chat                              │
│ - WebSocket or HTTP polling for real-time updates           │
│ - localStorage for conversation state                        │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: n8n Orchestration (Hostinger VPS Docker)          │
│ - Webhook endpoint receives messages                         │
│ - Router node (keyword-based agent selection)               │
│ - Agent prompt nodes (Creation / Automation)                 │
│ - RAG query orchestration                                    │
│ - Claude API integration                                     │
│ - Conversation memory management                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ PostgreSQL
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Supabase Database                                  │
│ - pgvector extension for embeddings                          │
│ - Tables: users, conversations, messages, documents          │
│ - RLS policies for data security                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ APIs
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: External Services                                  │
│ - Claude API (Anthropic) - conversational AI                │
│ - OpenAI API - text embeddings                              │
│ - Cohere API - reranking (top 20 → top 3)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: Chat Widget UI

### Technical Requirements

**Display & Behavior:**
- Floating button: bottom-right, 60x60px, customizable color/icon
- Click opens popup: 400x600px (desktop), full-screen (mobile <768px)
- Auto-resume active conversations on page load
- Create new conversation if none active
- Responsive design: mobile-first approach

**Functional Requirements:**
- Send text messages (enter key or send button)
- Display bot responses with typing indicator
- Scroll to latest message automatically
- Store conversation ID in localStorage
- Handle connection errors gracefully (retry logic)

**Technical Stack:**
- Pure JavaScript (no framework dependencies for minimal load)
- CSS with scoped classes to avoid Kajabi conflicts
- Single script tag embed: `<script src="https://[domain]/widget.js"></script>`

**API Integration:**
- POST to n8n webhook: `{conversationId, userId, message, timestamp}`
- Receive response: `{response, conversationId, agentType}`
- WebSocket preferred for real-time, HTTP polling fallback

**Deliverables:**
- `widget.js` - minified JavaScript bundle
- `widget.css` - scoped styles
- `embed-example.html` - integration documentation
- Configuration options: colors, position, welcome message

---

## Component 2: n8n Orchestration Backend

### Workflow Architecture

**Main Workflow: Message Processing**

```
[Webhook Trigger]
    ↓
[Validate Input] (conversationId, userId, message)
    ↓
[Load Conversation History] (last 10 messages from Supabase)
    ↓
[Keyword Router]
    ├─ "création", "contenu", "instagram", "branding" → Creation Agent
    └─ "automatisation", "tunnel", "vente", "technique" → Automation Agent
    ↓
[RAG Query]
    ├─ Generate embedding (OpenAI)
    ├─ Query pgvector (Supabase - top 20)
    └─ Rerank (Cohere - top 3)
    ↓
[Assemble Context]
    ├─ Conversation history (10 messages)
    ├─ RAG results (top 3 chunks)
    └─ Agent-specific system prompt
    ↓
[Claude API Call]
    ├─ Model: claude-3-5-sonnet
    ├─ Max tokens: 1000
    └─ Temperature: 0.7
    ↓
[Loop Detection] (check if conversation circling)
    ├─ YES → Trigger upsell message + flag conversation
    └─ NO → Continue
    ↓
[Save to Database]
    ├─ User message
    └─ Bot response
    ↓
[Return Response] (JSON to widget)
```

**Supporting Workflows:**

1. **Document Ingestion Pipeline:**
   - Trigger: Manual webhook or file upload event
   - Process: Extract text → Chunk (500 tokens, 50 overlap) → Generate embeddings → Store in Supabase

2. **Conversation Analytics:**
   - Trigger: Scheduled (daily)
   - Process: Aggregate stats, identify common questions, export to CSV

### Technical Requirements

**n8n Configuration:**
- Self-hosted on Hostinger VPS Docker
- PostgreSQL backend for workflow state
- Environment variables for API keys
- Webhook authentication (shared secret)

**Agent Prompts (stored in n8n nodes):**

**Creation Agent:**
```
Tu es un expert en création de contenu pour L'Agence des Copines.
Tu aides les professionnels du bien-être à développer leur stratégie
Instagram, créer du contenu engageant, et construire leur marque.

Contexte de conversation:
{conversation_history}

Documentation pertinente:
{rag_results}

Réponds de manière concise, actionnable, et dans le style chaleureux
de L'Agence des Copines.
```

**Automation Agent:**
```
Tu es un expert en automatisation et tunnels de vente pour L'Agence des Copines.
Tu aides les professionnels du bien-être à configurer leurs funnels,
automatiser leur marketing, et optimiser leurs outils techniques.

Contexte de conversation:
{conversation_history}

Documentation pertinente:
{rag_results}

Réponds de manière concise, actionnable, et dans le style chaleureux
de L'Agence des Copines.
```

**Loop Detection Logic:**
- Count user messages in last 10 messages
- If >6 user messages and semantic similarity >0.8 → trigger upsell

**Deliverables:**
- Exported n8n workflows (JSON)
- Environment variable template
- Workflow documentation (Markdown)
- Testing guide with sample payloads

---

## Component 3: RAG Knowledge Base

### Multi-Format File Ingestion

**Supported Formats:**
- PDF documents
- Microsoft Excel (.xlsx, .xls)
- Images (OCR extraction: .jpg, .png)
- Text files (.txt, .md)
- Word documents (.docx)

**Processing Pipeline:**

```
File Upload (via Benoit manual process in V1)
    ↓
[Format Detection]
    ├─ PDF → pdfplumber text extraction
    ├─ Excel → pandas read + concatenate cells
    ├─ Image → Tesseract OCR
    ├─ Text → direct read
    └─ Word → python-docx extraction
    ↓
[Text Chunking]
    ├─ Chunk size: 500 tokens
    ├─ Overlap: 50 tokens
    └─ Preserve sentence boundaries
    ↓
[Generate Embeddings]
    ├─ Model: text-embedding-3-small (OpenAI)
    └─ Dimensions: 1536
    ↓
[Store in Supabase]
    ├─ documents table: {id, filename, upload_date, file_type}
    └─ document_chunks table: {id, document_id, content, embedding}
```

**Query Pipeline:**

```
User Question
    ↓
[Generate Query Embedding] (OpenAI)
    ↓
[Vector Similarity Search] (Supabase pgvector)
    ├─ Cosine similarity
    └─ Return top 20 results
    ↓
[Rerank] (Cohere API)
    ├─ Model: rerank-english-v3.0
    └─ Return top 3 results
    ↓
[Format for Claude] (concatenate chunks with metadata)
```

### Database Schema

**Supabase Tables:**

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    name TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    last_message_at TIMESTAMP,
    status TEXT DEFAULT 'active' -- active, archived, escalated
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role TEXT, -- 'user' or 'assistant'
    content TEXT,
    agent_type TEXT, -- 'creation' or 'automation'
    timestamp TIMESTAMP DEFAULT now()
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT,
    file_type TEXT,
    upload_date TIMESTAMP DEFAULT now(),
    uploaded_by TEXT
);

-- Document Chunks (with pgvector)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    content TEXT,
    embedding VECTOR(1536),
    chunk_index INTEGER
);

-- Create vector similarity index
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

**Deliverables:**
- Python script for document ingestion (supports all formats)
- Database migration SQL files
- RAG query testing notebook (Jupyter)
- Content upload guide for Benoit

---

## Component 4: Infrastructure & Deployment

### Hostinger VPS Configuration

**Server Specs Required:**
- 4 vCPU minimum
- 8GB RAM minimum
- 100GB SSD storage
- Ubuntu 22.04 LTS

**Docker Compose Stack:**

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_WEBHOOK_URL=https://[domain]/webhook
      - DB_TYPE=postgresdb
    volumes:
      - n8n_data:/home/node/.n8n

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

**External Services:**
- Supabase (managed PostgreSQL with pgvector)
- Cloudflare for DNS and DDoS protection

### Performance Requirements

**Response Time:**
- Widget load: <2 seconds
- Message send to response: <10 seconds
- RAG query: <3 seconds
- Claude API call: <5 seconds

**Concurrency:**
- Support 50 simultaneous conversations
- n8n workflow queue: 100 concurrent executions

**Availability:**
- 99% uptime target
- Graceful degradation if external APIs fail

### Cost Breakdown (Monthly)

```
Hostinger VPS:              30€
Supabase (Pro tier):        25€
Claude API (~10k msgs):     40€
OpenAI embeddings:          15€
Cohere reranking:           10€
─────────────────────────────
TOTAL:                     120€
```

**Deliverables:**
- Docker Compose configuration
- Nginx reverse proxy config
- SSL certificate setup guide
- Deployment runbook (step-by-step)
- Monitoring setup (logs, uptime)

---

## Technical Constraints

### Hard Requirements

1. **Timeline:** 5 days from start to production deployment
2. **Budget:** 2,500€ development cost, <120€/month operational
3. **Performance:** <10s response time, 50 concurrent users
4. **Platform:** Must embed in Kajabi without conflicts
5. **Maintenance:** Benoit must be able to manage n8n workflows and content uploads

### Technology Stack (Fixed)

**Frontend:**
- Vanilla JavaScript (ES6+)
- CSS3 with scoped classes

**Backend:**
- n8n (self-hosted Docker)
- Node.js (for custom scripts if needed)

**Database:**
- Supabase (PostgreSQL + pgvector)

**APIs:**
- Claude 3.5 Sonnet (Anthropic)
- text-embedding-3-small (OpenAI)
- rerank-english-v3.0 (Cohere)

**Infrastructure:**
- Hostinger VPS
- Docker + Docker Compose
- Nginx reverse proxy

### Assumptions

1. Client provides initial content (ebooks, formations) for RAG ingestion
2. Kajabi allows custom script tag embeds (verified)
3. Hostinger VPS has Docker support (verified)
4. Benoit has API keys for all services (Claude, OpenAI, Cohere)
5. No authentication required for MVP (open widget for all Kajabi visitors)

---

## Deliverables & Acceptance Criteria

### Code Deliverables

1. **Chat Widget Package:**
   - `widget.js` (minified)
   - `widget.css`
   - `README.md` (integration guide)
   - Configuration options documentation

2. **n8n Workflows:**
   - Message processing workflow (JSON export)
   - Document ingestion workflow (JSON export)
   - Analytics workflow (JSON export)
   - Workflow documentation (Markdown)

3. **RAG Scripts:**
   - `ingest_documents.py` (multi-format support)
   - `query_rag.py` (testing script)
   - `requirements.txt`
   - Usage guide

4. **Infrastructure Code:**
   - `docker-compose.yml`
   - `nginx.conf`
   - `.env.template`
   - Deployment scripts

### Documentation Deliverables

1. **Deployment Guide:**
   - Server setup steps
   - Docker installation
   - Service configuration
   - SSL certificate setup
   - First-time initialization

2. **Maintenance Guide:**
   - How to upload new documents
   - How to modify agent prompts in n8n
   - How to monitor conversations
   - Troubleshooting common issues

3. **API Documentation:**
   - Widget → n8n webhook contract
   - Database schema reference
   - n8n workflow diagram

### Acceptance Criteria

**Widget UI:**
- ✅ Embeds in Kajabi without styling conflicts
- ✅ Opens/closes smoothly on all devices
- ✅ Sends messages and displays responses
- ✅ Resumes conversations on page refresh

**n8n Integration:**
- ✅ Webhook receives widget messages reliably
- ✅ Router correctly identifies Creation vs Automation keywords
- ✅ RAG query returns relevant context
- ✅ Claude responses maintain brand voice
- ✅ Conversation history loads correctly

**RAG System:**
- ✅ Successfully ingests PDF, Excel, images, text, Word docs
- ✅ Embeddings stored in Supabase pgvector
- ✅ Query returns semantically relevant results
- ✅ Reranking improves result quality

**Performance:**
- ✅ <10 second response time under 50 concurrent users
- ✅ No message loss or dropped connections
- ✅ Graceful error handling when APIs timeout

**Infrastructure:**
- ✅ All services running on Hostinger VPS
- ✅ SSL configured correctly
- ✅ Monitoring and logging operational
- ✅ Backup strategy documented

---

## Risks & Mitigation

### Technical Risks

**Risk 1: Kajabi Script Conflicts**
- **Impact:** Widget doesn't load or breaks page
- **Mitigation:** Namespace all CSS classes, use IIFE for JavaScript, test on staging Kajabi site

**Risk 2: n8n Performance Bottleneck**
- **Impact:** Response times exceed 10s under load
- **Mitigation:** Implement caching for frequent queries, optimize n8n workflow execution order

**Risk 3: RAG Returns Irrelevant Results**
- **Impact:** Claude responses miss the mark, user dissatisfaction
- **Mitigation:** Cohere reranking, manual testing with client's actual questions, tune chunk sizes

**Risk 4: API Cost Overruns**
- **Impact:** Monthly costs exceed 120€ budget
- **Mitigation:** Implement response caching, limit Claude max tokens, monitor usage daily

**Risk 5: File Format Processing Failures**
- **Impact:** Some documents fail to ingest
- **Mitigation:** Error handling with detailed logs, fallback to manual text extraction

### Timeline Risks

**Risk:** 5-day timeline is aggressive
- **Mitigation:**
  - Focus on MVP scope only (no admin UI in V1)
  - Use pre-built libraries (no custom implementations)
  - Daily progress checkpoints
  - Buffer day for unexpected issues

---

## Open Questions for Architecture Phase

1. **Widget State Management:** WebSocket vs HTTP polling? (WebSocket preferred but adds complexity)
2. **User Identification:** Anonymous UUIDs vs require email? (Anonymous for MVP?)
3. **Conversation Archival:** When to archive conversations? (After 30 days inactive?)
4. **Loop Detection Threshold:** How many circular messages before escalation? (6+ messages with >0.8 similarity?)
5. **RAG Chunk Size Optimization:** 500 tokens optimal or test 300/700? (Test in architecture phase)

---

## Next Steps

**Immediate Actions:**
1. Architecture review of this technical spec
2. Confirm API keys availability (Claude, OpenAI, Cohere)
3. Provision Hostinger VPS and Supabase project
4. Create detailed implementation plan (task breakdown)
5. Set up development environment

**Phase Transitions:**
- **After Architecture Approval:** Begin sprint planning (create stories)
- **After Implementation:** Deployment to staging → client testing → production launch

---

_This Technical Specification serves as the foundation for architecture decisions and sprint planning._

_Next Steps: Handoff to Architect for system design and tech stack validation._
