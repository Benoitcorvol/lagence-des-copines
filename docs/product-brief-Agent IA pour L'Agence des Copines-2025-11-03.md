# Product Brief: Agent IA pour L'Agence des Copines

**Date:** 2025-11-03
**Author:** Benoit
**Status:** Draft for PM Review

---

## Executive Summary

{{executive_summary}}

---

## Problem Statement

**Current State Pain Points:**

L'Agence des Copines faces a critical operational challenge: no self-service AI support system exists, forcing the team to handle all community questions manually. The organization has accumulated substantial knowledge assets (ebooks, formations, past conversations) that remain underutilized in static formats. There is no automated mechanism to identify complex questions requiring human intervention, creating inefficiencies and missed upsell opportunities.

**Technical Challenges:**

1. **Embedding Challenge:** Widget must integrate seamlessly into Kajabi without JavaScript conflicts or styling issues
2. **Orchestration Complexity:** Intelligent routing required between 2 specialized agents (Creation vs Automation) based on query intent and conversation context
3. **Knowledge Management:** RAG system must enable non-technical users to add/update content easily without developer intervention
4. **Conversation Continuity:** Users expect seamless conversation pickup across sessions with full context retention
5. **Performance at Scale:** System must support 50 concurrent users with <10 second response time on VPS hosting infrastructure

**Why Existing Solutions Fail:**

- **Generic Chatbot SaaS** (Intercom, Drift): No custom RAG integration, no dual-agent routing capability, prohibitively expensive for budget
- **Custom Development Shops:** Timeline exceeds 5-day constraint, typical costs exceed 2,500€ budget
- **Simple FAQ Bots:** No conversational memory, no intelligent escalation to human support, poor user experience

**Core Problem:**

Need a modular, production-ready system with clean architectural separation (Widget → n8n Orchestration → RAG Knowledge → Claude API) that the client can maintain and scale long-term without ongoing developer dependency.

---

## Proposed Solution

**Solution Architecture: n8n-First Modular AI System**

The solution is a 4-layer architecture with **all AI intelligence centralized in n8n workflows**, enabling non-technical maintenance and iteration:

**Layer 1: Frontend Widget**
- Intercom-style floating chat button (bottom-right)
- Click opens popup chat interface
- Auto-resumes active conversations or creates new ones
- Fully responsive (mobile/desktop adaptive)
- Single script tag embed for Kajabi integration

**Layer 2: Orchestration + AI Intelligence (n8n - Core Innovation)**
- Webhook endpoint receives all chat messages
- **Visual workflow contains ALL AI logic:**
  - Keyword-based router determines agent (Creation vs Automation)
  - Agent prompts stored as n8n nodes (editable in UI)
  - RAG query orchestration (fetch → rerank → assemble context)
  - Claude API integration with full context assembly
  - Conversation memory management (last 10 messages)
  - Response formatting and delivery
- **Client-maintainable:** Modify prompts, routing rules, add agents without developer intervention
- **Visual debugging:** See exact conversation flow, identify failure points in n8n UI
- Hosted in Hostinger VPS Docker container

**Layer 3: Knowledge + Data Layer (Supabase)**
- pgvector for semantic search on knowledge base
- Tables: users, conversations, messages, user_context, documents
- OpenAI embeddings for document chunks
- Client uploads ebooks/PDFs → automatic chunking + embedding

**Layer 4: Enhancement Layer (Cohere)**
- Reranking service: top 20 RAG results → top 3 most relevant
- Improves response precision without token bloat

**Key Differentiators:**

1. **Non-Technical Maintainability:** ALL AI behavior lives in visual n8n workflows - client can modify agent personalities, routing logic, and conversation flows without touching code
2. **Cost Transparency:** Client sees exact API costs per conversation in n8n logs, enabling budget optimization
3. **Brand Voice Preservation:** RAG grounds responses in L'Agence des Copines' own content (ebooks, formations), ensuring consistent brand identity
4. **Intelligent Escalation:** Detects conversation loops and gracefully suggests human accompaniment (upsell trigger)
5. **Infrastructure Control:** Self-hosted on client's Hostinger VPS - no vendor lock-in, full data ownership
6. **Rapid Extensibility:** Adding 3rd agent = duplicate n8n workflow + adjust router node (15 minutes, no deployment)

**Why This Succeeds:**

- **Keyword routing** is faster and more reliable than complex NLP classification for binary agent selection
- **Visual workflows** eliminate "black box" AI - client understands and controls system behavior
- **Modular architecture** allows independent updates to widget, agents, or knowledge base without system-wide changes
- **Performance-optimized:** Reranking reduces Claude context size, enabling <10s response times even with large knowledge bases
- **Budget-aligned:** <120€/month operational costs vs 300-500€/month for equivalent SaaS solutions

---

## Target Users

### Primary User Segment: Community Members (End Users)

**Profile:**
- 3000 health and wellness professionals (coaches, nutritionists, yoga instructors, wellness entrepreneurs)
- Varying e-commerce and Instagram marketing experience levels
- Comfortable with digital tools like Kajabi but not technical experts
- Seeking quick, actionable guidance on strategy and implementation

**Current Behavior:**
- Ask questions via community channels, DMs, or email support
- Need answers during active work (launching products, creating content, troubleshooting funnels)
- Often repeat questions already answered in existing content (ebooks, formations)

**Pain Points:**
- Wait times for manual support responses create workflow delays
- Difficult to search through extensive content library to find specific answers
- Need guidance that matches L'Agence des Copines' specific methodologies and voice

**Goals:**
- Get unstuck quickly without waiting for human support
- Receive answers that feel personalized and aligned with L'Agence des Copines approach
- Access expertise 24/7 during their working hours

**Success Criteria:**
- Chatbot response feels indistinguishable from L'Agence des Copines team member
- Gets actionable answer in <10 seconds
- Can resume conversations seamlessly across sessions

### Secondary User Segment: L'Agence des Copines (Client - Content Manager)

**Profile:**
- Non-technical business owner managing community and content
- Comfortable with Google Docs, Excel, basic web tools
- NOT comfortable with n8n, code, or technical infrastructure
- Expects AI implementation as market standard ("2025 expectation")

**Current Behavior:**
- Creates ebooks, formations, and educational content for community
- Monitors community questions and engagement patterns
- Provides strategic direction for content and support approach

**Pain Points:**
- Cannot dedicate team time to answering repetitive questions
- Wants AI support but lacks technical expertise to manage complex systems
- Needs transparency into what chatbot is doing without technical dashboards

**Goals:**
- Keep knowledge base current with new content releases
- Monitor chatbot effectiveness through simple feedback
- Identify upsell opportunities from complex conversations

**Success Criteria (MVP):**
- Can provide new content files to Benoit for RAG updates (manual process acceptable for V1)
- Receives periodic feedback summaries on chatbot performance
- Sees conversion from chatbot to paid accompaniment services

**MVP Scope Note:** Content management in V1 handled via Benoit (developer/maintainer). Self-service admin panel for content uploads planned for Phase 2 to validate core chatbot functionality first within timeline/budget constraints.

### Tertiary User Segment: Benoit (CTO/Technical Maintainer)

**Profile:**
- Technical owner responsible for system maintenance and iteration
- Comfortable with n8n, APIs, infrastructure management
- Primary point of contact for technical adjustments and troubleshooting

**Responsibilities:**
- Maintain n8n workflows (agent prompts, routing logic, RAG orchestration)
- Handle content uploads to RAG system (V1 manual process)
- Debug issues and optimize performance
- Implement feature enhancements post-MVP

**Requirements:**
- Well-documented n8n workflows for efficient maintenance
- Clear separation of concerns (widget / n8n / database layers)
- Ability to iterate on agent behavior based on client feedback

---

## Goals and Success Metrics

### Business Objectives

{{business_objectives}}

### User Success Metrics

{{user_success_metrics}}

### Key Performance Indicators (KPIs)

{{key_performance_indicators}}

---

## Strategic Alignment and Financial Impact

### Financial Impact

{{financial_impact}}

### Company Objectives Alignment

{{company_objectives_alignment}}

### Strategic Initiatives

{{strategic_initiatives}}

---

## MVP Scope

### Core Features (Must Have)

{{core_features}}

### Out of Scope for MVP

{{out_of_scope}}

### MVP Success Criteria

{{mvp_success_criteria}}

---

## Post-MVP Vision

### Phase 2 Features

{{phase_2_features}}

### Long-term Vision

{{long_term_vision}}

### Expansion Opportunities

{{expansion_opportunities}}

---

## Technical Considerations

### Platform Requirements

{{platform_requirements}}

### Technology Preferences

{{technology_preferences}}

### Architecture Considerations

{{architecture_considerations}}

---

## Constraints and Assumptions

### Constraints

{{constraints}}

### Key Assumptions

{{key_assumptions}}

---

## Risks and Open Questions

### Key Risks

{{key_risks}}

### Open Questions

{{open_questions}}

### Areas Needing Further Research

{{research_areas}}

---

## Appendices

### A. Research Summary

{{research_summary}}

### B. Stakeholder Input

{{stakeholder_input}}

### C. References

{{references}}

---

_This Product Brief serves as the foundational input for Product Requirements Document (PRD) creation._

_Next Steps: Handoff to Product Manager for PRD development using the `workflow prd` command._
