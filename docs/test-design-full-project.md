# Test Design: Agent IA pour L'Agence des Copines (Full Project)

**Date:** 2025-11-03
**Author:** Benoit (with Murat - Master Test Architect)
**Status:** Ready for Review

---

## Executive Summary

**Scope:** Comprehensive test design for production-ready AI chatbot system with Kajabi embedding, n8n orchestration, and RAG knowledge base.

**Risk Summary:**

- Total risks identified: 18
- High-priority risks (≥6): 8
- Critical categories: SEC (3), PERF (2), TECH (2), DATA (1)

**Coverage Summary:**

- P0 scenarios: 22 (44 hours)
- P1 scenarios: 18 (18 hours)
- P2/P3 scenarios: 15 (7.5 hours)
- **Total effort**: 69.5 hours (~9 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                  | Probability | Impact | Score | Mitigation                                           | Owner     | Timeline   |
| ------- | -------- | ------------------------------------------------------------ | ----------- | ------ | ----- | ---------------------------------------------------- | --------- | ---------- |
| R-001   | SEC      | Widget script injection via Kajabi conflicts                 | 2           | 3      | 6     | Shadow DOM isolation + CSP headers + code review     | Dev       | Pre-launch |
| R-002   | SEC      | n8n webhook exposed without rate limiting                    | 3           | 3      | 9     | Implement 10 msg/min limit + UUID validation         | Dev       | Pre-launch |
| R-003   | SEC      | RAG returns sensitive data from wrong user context           | 2           | 3      | 6     | Add user_id filtering in pgvector queries            | Dev       | Pre-launch |
| R-004   | PERF     | Claude API timeout under 50 concurrent users                 | 3           | 3      | 9     | Load testing + timeout handling + queue management   | Dev + QA  | Pre-launch |
| R-005   | PERF     | Widget bundle size >50kb breaks 2s load requirement          | 2           | 3      | 6     | Minification + gzip + bundle analysis                | Dev       | Pre-launch |
| R-006   | TECH     | n8n workflow failures not recovered gracefully               | 2           | 3      | 6     | Error handling + retry logic + fallback responses    | Dev       | Pre-launch |
| R-007   | DATA     | Conversation history lost on localStorage clear              | 2           | 3      | 6     | Backend persistence + recovery mechanism             | Dev       | Pre-launch |
| R-008   | TECH     | Kajabi CSS conflicts break widget UI                         | 2           | 3      | 6     | Shadow DOM + scoped CSS + cross-browser testing      | Dev + QA  | Pre-launch |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                                  | Probability | Impact | Score | Mitigation                                   | Owner     |
| ------- | -------- | ------------------------------------------------------------ | ----------- | ------ | ----- | -------------------------------------------- | --------- |
| R-009   | BUS      | Loop detection triggers too early (false positives)          | 2           | 2      | 4     | Test threshold tuning + semantic similarity  | QA        |
| R-010   | OPS      | SSL certificate auto-renewal fails                           | 1           | 3      | 3     | Certbot cron + monitoring + manual renewal   | Ops       |
| R-011   | PERF     | RAG query >3s degrades user experience                       | 2           | 2      | 4     | pgvector indexing + Cohere reranking tuning  | Dev       |
| R-012   | DATA     | Document chunking breaks context (poor RAG results)          | 2           | 2      | 4     | Sentence boundary preservation + testing     | Dev + QA  |
| R-013   | TECH     | Mobile fullscreen layout breaks on landscape orientation     | 2           | 2      | 4     | Responsive testing + device matrix           | QA        |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                                  | Probability | Impact | Score | Action  |
| ------- | -------- | ------------------------------------------------------------ | ----------- | ------ | ----- | ------- |
| R-014   | BUS      | Typing indicator animation stutters on slow connections      | 1           | 2      | 2     | Monitor |
| R-015   | OPS      | Docker container restart during conversation                 | 1           | 2      | 2     | Monitor |
| R-016   | TECH     | Widget source map missing for debugging                      | 1           | 1      | 1     | Monitor |
| R-017   | BUS      | Agent routing keywords overlap causing ambiguity             | 1           | 2      | 2     | Monitor |
| R-018   | TECH     | Nginx cache prevents immediate widget updates                | 1           | 1      | 1     | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (Shadow DOM, responsive design, CSS isolation)
- **SEC**: Security (XSS prevention, rate limiting, data isolation)
- **PERF**: Performance (load time, API response, concurrency)
- **DATA**: Data Integrity (conversation persistence, chunking accuracy)
- **BUS**: Business Impact (loop detection, UX quality, agent routing)
- **OPS**: Operations (SSL renewal, deployment, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement                                                  | Test Level | Risk Link | Test Count | Owner | Notes                                       |
| ------------------------------------------------------------ | ---------- | --------- | ---------- | ----- | ------------------------------------------- |
| FR001: Widget embeds in Kajabi without conflicts (Shadow DOM) | E2E        | R-008     | 3          | QA    | Test on actual Kajabi staging               |
| FR002-003: Floating button and popup/fullscreen              | E2E        | R-008     | 4          | QA    | Desktop + mobile, visual regression         |
| FR004-005: Send messages and display responses               | E2E        | R-002     | 5          | QA    | Happy path + timeout + error handling       |
| FR010-020: n8n message processing workflow                   | API        | R-006     | 6          | QA    | Agent routing, RAG, Claude integration      |
| FR028-029: Rate limiting and validation                      | API        | R-002     | 3          | QA    | 10 msg/min enforcement, UUID validation     |
| FR030: CORS headers for Kajabi origin only                   | API        | R-001     | 2          | QA    | Security boundary testing                   |
| NFR003: <10s end-to-end response time                        | E2E        | R-004     | 4          | QA    | Load testing with 50 concurrent users       |
| NFR006: Widget bundle <50kb gzipped                          | Unit       | R-005     | 1          | Dev   | Build artifact verification                 |
| FR006-007: Conversation persistence across reloads           | E2E        | R-007     | 3          | QA    | localStorage + backend recovery             |

**Total P0**: 22 tests, 44 hours (2 hours per test average for critical scenarios)

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement                                                  | Test Level | Risk Link | Test Count | Owner | Notes                                    |
| ------------------------------------------------------------ | ---------- | --------- | ---------- | ----- | ---------------------------------------- |
| FR008-009: Error messages and retry logic                   | E2E        | R-006     | 3          | QA    | Network failures, API errors             |
| FR012-014: Keyword router (Creation vs Automation agents)   | API        | R-017     | 4          | QA    | Edge cases, keyword overlap              |
| FR015: RAG query pipeline (embed → pgvector → rerank)       | API        | R-011     | 3          | QA    | Query accuracy, performance              |
| FR018: Loop detection logic                                  | API        | R-009     | 3          | QA    | Threshold tuning, false positive testing |
| FR021-027: Multi-format document ingestion (PDF, Excel, etc.) | Unit       | R-012     | 6          | Dev   | All formats + chunking accuracy          |
| NFR002: Widget load time <2s                                 | E2E        | R-005     | 2          | QA    | First render performance                 |
| Mobile responsive (fullscreen <768px)                       | E2E        | R-013     | 3          | QA    | Portrait + landscape, keyboard UX        |

**Total P1**: 18 tests, 18 hours (1 hour per test average)

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement                                                  | Test Level | Risk Link | Test Count | Owner | Notes                               |
| ------------------------------------------------------------ | ---------- | --------- | ---------- | ----- | ----------------------------------- |
| FR006: 5-minute message cache                                | Unit       | -         | 2          | Dev   | Cache expiration logic              |
| FR016-017: Context assembly for Claude API                   | Unit       | -         | 3          | Dev   | Prompt formatting, token limits     |
| FR019: Save messages to Supabase                             | API        | -         | 2          | QA    | Database schema validation          |
| Visual design consistency (brand colors, border-radius)      | E2E        | R-014     | 3          | QA    | Visual regression testing           |
| Accessibility (WCAG AA: keyboard nav, ARIA labels, contrast) | E2E        | -         | 4          | QA    | Axe-core automated + manual         |
| SSL certificate monitoring                                   | Ops        | R-010     | 1          | Ops   | Expiry check automation             |

**Total P2**: 12 tests, 6 hours (0.5 hours per test average)

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement                          | Test Level | Test Count | Owner | Notes                       |
| ------------------------------------ | ---------- | ---------- | ----- | --------------------------- |
| Debug logging (lac_debug flag)       | Unit       | 1          | Dev   | Console output verification |
| Widget source map accuracy           | Unit       | 1          | Dev   | Debugging support           |
| n8n workflow export/import           | Manual     | 1          | Ops   | Disaster recovery           |

**Total P3**: 3 tests, 1.5 hours (0.25 hours per test average)

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Widget loads on Kajabi (no console errors) (30s)
- [ ] Floating button visible and clickable (30s)
- [ ] Send "Hello" message and receive bot response (1min)
- [ ] n8n webhook responds to health check (30s)
- [ ] Supabase connection successful (30s)

**Total**: 5 scenarios

### P0 Tests (<30 min)

**Purpose**: Critical path validation

- [ ] Shadow DOM isolation prevents Kajabi CSS conflicts (E2E)
- [ ] Desktop popup (400x600px) opens/closes smoothly (E2E)
- [ ] Mobile fullscreen chat works on iPhone/Android (E2E)
- [ ] User sends message → n8n routes to correct agent → Claude response (E2E)
- [ ] Rate limit enforced: 11th message in 1 minute returns 429 (API)
- [ ] CORS headers present for Kajabi origin (API)
- [ ] 50 concurrent users achieve <10s response time (E2E Load)
- [ ] Widget bundle size verification <50kb gzipped (Unit)
- [ ] Conversation persists after page reload (E2E)

**Total**: 22 scenarios

### P1 Tests (<60 min)

**Purpose**: Important feature coverage

- [ ] Network error shows retry button (E2E)
- [ ] Keyword "création" routes to Creation Agent (API)
- [ ] Keyword "automatisation" routes to Automation Agent (API)
- [ ] RAG query returns relevant document chunks (API)
- [ ] Loop detection triggers after 6 similar messages (API)
- [ ] PDF document ingested and chunked correctly (Unit)
- [ ] Excel file processed with cell concatenation (Unit)
- [ ] Widget load time <2s on first render (E2E)
- [ ] Mobile landscape orientation displays correctly (E2E)

**Total**: 18 scenarios

### P2/P3 Tests (<90 min)

**Purpose**: Full regression coverage

- [ ] Message cache expires after 5 minutes (Unit)
- [ ] Claude API prompt formatted with history + RAG (Unit)
- [ ] Messages saved to Supabase messages table (API)
- [ ] Brand colors match L'Agence des Copines palette (E2E Visual)
- [ ] Keyboard navigation works (Tab, Enter, Esc) (E2E)
- [ ] ARIA labels present for screen readers (E2E)
- [ ] SSL certificate not expired (Ops)

**Total**: 15 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count | Hours/Test | Total Hours | Notes                          |
| --------- | ----- | ---------- | ----------- | ------------------------------ |
| P0        | 22    | 2.0        | 44          | Complex setup, security-heavy  |
| P1        | 18    | 1.0        | 18          | Standard coverage              |
| P2        | 12    | 0.5        | 6           | Simple scenarios               |
| P3        | 3     | 0.5        | 1.5         | Exploratory                    |
| **Total** | **55** | **-**      | **69.5**    | **~9 days** (1 person at 8h/d) |

### Prerequisites

**Test Data:**

- user_factory (Faker-based: UUID, email, name, timestamps)
- conversation_factory (conversationId, userId, message history)
- document_factory (PDF, Excel, images for RAG ingestion testing)

**Tooling:**

- Playwright for E2E (widget embedding, user journeys)
- Playwright API testing for n8n webhooks
- Jest/Vitest for unit tests (pure functions, utilities)
- Axe-core for accessibility validation
- k6 or Artillery for load testing (50 concurrent users)
- Lighthouse for performance metrics

**Environment:**

- Kajabi staging site with test account
- Hostinger VPS staging environment (separate from production)
- Supabase test project (separate database)
- n8n staging instance with test workflows
- Test API keys for Claude, OpenAI, Cohere (separate from production)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths** (FR001-009, FR010-020, FR028-030): ≥80%
- **Security scenarios** (SEC category): 100%
- **Performance** (NFR001-003): All targets met
- **Accessibility** (WCAG AA): 100% compliance

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] Security tests (SEC category) pass 100%
- [ ] Performance targets met: <2s load, <10s response, 50 concurrent users
- [ ] Widget bundle <50kb gzipped
- [ ] Rate limiting enforced (10 msg/min)
- [ ] Shadow DOM isolation verified
- [ ] Conversation persistence functional

---

## Mitigation Plans

### R-002: n8n webhook exposed without rate limiting (Score: 9)

**Mitigation Strategy:**
1. Implement rate limiting in n8n workflow: max 10 messages per minute per conversationId
2. Add UUID validation (v4 format) for conversationId and userId
3. Return HTTP 429 with clear French error message when limit exceeded
4. Monitor rate limit violations in n8n logs
5. Add tests: 11th message in 60s returns 429, valid UUIDs accepted, invalid UUIDs rejected

**Owner:** Dev team (backend)
**Timeline:** Before production launch
**Status:** Planned
**Verification:** API test suite + load testing with rate limit abuse scenarios

### R-004: Claude API timeout under 50 concurrent users (Score: 9)

**Mitigation Strategy:**
1. Load testing with 50 concurrent users to identify bottlenecks
2. Implement timeout handling: if Claude API >8s, show retry message to user
3. Add queue management in n8n to prevent API overload
4. Monitor Claude API response times in production
5. Implement fallback response if all retries fail: "Je rencontre un souci technique. Réessaye dans un instant !"

**Owner:** Dev team + QA team
**Timeline:** Before production launch
**Status:** In Progress
**Verification:** Load tests with Artillery/k6, monitor Claude API response times, verify timeout handling

### R-001: Widget script injection via Kajabi conflicts (Score: 6)

**Mitigation Strategy:**
1. Use Shadow DOM for complete CSS isolation
2. Add Content Security Policy (CSP) headers in Nginx
3. Namespace all JavaScript variables with IIFE
4. Code review for XSS vulnerabilities (escaping user input)
5. Test on actual Kajabi staging site before production

**Owner:** Dev team (frontend)
**Timeline:** Before production launch
**Status:** Planned
**Verification:** Manual testing on Kajabi staging, CSP header validation, code review checklist

### R-003: RAG returns sensitive data from wrong user context (Score: 6)

**Mitigation Strategy:**
1. Add user_id filtering in pgvector queries (currently missing)
2. Verify that document_chunks table has user_id foreign key
3. Test: User A cannot see User B's private documents
4. Review RAG query workflow in n8n for security gaps
5. Add logging for all RAG queries (userId + documentIds returned)

**Owner:** Dev team (backend)
**Timeline:** Before production launch
**Status:** Planned
**Verification:** Integration tests with multi-user scenarios, penetration testing

### R-005: Widget bundle size >50kb breaks 2s load requirement (Score: 6)

**Mitigation Strategy:**
1. Minify JavaScript with Terser (already planned)
2. Enable gzip compression in Nginx (already configured)
3. Run bundle analysis: `source-map-explorer dist/widget.min.js`
4. Remove unused code (tree shaking)
5. Lazy load conversation history (load only on widget open)

**Owner:** Dev team (frontend)
**Timeline:** During widget development
**Status:** In Progress
**Verification:** Build artifact size check (<50kb gzipped), Lighthouse performance score ≥90

### R-006: n8n workflow failures not recovered gracefully (Score: 6)

**Mitigation Strategy:**
1. Add error handling in n8n workflow nodes (try-catch equivalent)
2. Implement retry logic for transient failures (Claude API timeout, Supabase connection)
3. Return user-friendly French error messages (not stack traces)
4. Add fallback response if all retries fail
5. Log all workflow failures for monitoring

**Owner:** Dev team (backend)
**Timeline:** During n8n workflow development
**Status:** Planned
**Verification:** Fault injection testing (kill Supabase connection, timeout Claude API)

### R-007: Conversation history lost on localStorage clear (Score: 6)

**Mitigation Strategy:**
1. Persist all conversations to Supabase messages table (already planned)
2. On widget load, if conversationId exists in localStorage BUT not in Supabase → create new conversation
3. Add recovery mechanism: user can "restore" conversation by email (future V2 feature)
4. Test: Clear localStorage → reload page → widget creates new conversation (no crash)
5. Document known limitation in README

**Owner:** Dev team (frontend + backend)
**Timeline:** During implementation
**Status:** Planned
**Verification:** E2E test with localStorage clear, verify graceful degradation

### R-008: Kajabi CSS conflicts break widget UI (Score: 6)

**Mitigation Strategy:**
1. Use Shadow DOM for complete style isolation (already planned)
2. Scope all CSS classes with `lac-` prefix as extra safety
3. Test on actual Kajabi staging site with different themes
4. Cross-browser testing: Chrome, Firefox, Safari, Edge
5. Visual regression testing with Playwright (screenshot comparison)

**Owner:** Dev team (frontend) + QA team
**Timeline:** During widget development + pre-launch testing
**Status:** In Progress
**Verification:** Manual testing on Kajabi staging, visual regression test suite, cross-browser matrix

---

## Assumptions and Dependencies

### Assumptions

1. Benoit provides initial content (PDFs, Excel files, ebooks) for RAG ingestion testing
2. Kajabi staging site available for integration testing (with test account)
3. Hostinger VPS provisioned and accessible via SSH
4. API keys available for all services (Claude, OpenAI, Cohere)
5. n8n visual workflow editor accessible for test workflow verification
6. 5-day development timeline includes time for test implementation
7. No authentication required for MVP (anonymous UUID users)

### Dependencies

1. **Supabase project setup** - Required by n8n workflows and RAG testing (Day 1)
2. **Hostinger VPS provisioned** - Required for n8n deployment and widget hosting (Day 1)
3. **Domain DNS configured** - chat.lagencedescopines.com → VPS IP (Day 1)
4. **SSL certificate** - Let's Encrypt configured before HTTPS testing (Day 1)
5. **Kajabi staging access** - Required for widget embedding tests (Day 2)
6. **n8n workflows deployed** - Required for E2E testing (Day 3)
7. **Test API keys** - Separate from production to avoid cost overruns (Day 1)

### Risks to Plan

- **Risk**: 5-day timeline is aggressive for full test coverage
  - **Impact**: Some P2/P3 tests may be deferred to post-launch
  - **Contingency**: Focus on P0/P1 tests, document P2/P3 as "known gaps"

- **Risk**: Kajabi staging site unavailable or differs significantly from production
  - **Impact**: Widget integration bugs discovered in production
  - **Contingency**: Test on local HTML file first, deploy to Kajabi production with feature flag

- **Risk**: Load testing reveals performance bottlenecks requiring architecture changes
  - **Impact**: Timeline extends beyond 5 days
  - **Contingency**: Implement caching (localStorage, n8n response cache) to reduce API calls

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: ____________ Date: ____________
- [ ] Tech Lead: ____________ Date: ____________
- [ ] QA Lead (Murat): ____________ Date: ____________

**Comments:**

---

---

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` - Risk scoring methodology (probability × impact matrix, 1-9 scale)
- `test-levels-framework.md` - Test level selection (E2E vs API vs Component vs Unit)
- `test-priorities-matrix.md` - P0-P3 prioritization criteria

### Related Documents

- PRD: `/Users/benoitcorvol/chatbot/chatbot/docs/PRD.md`
- Architecture: `/Users/benoitcorvol/chatbot/chatbot/docs/architecture.md`
- Tech Spec: `/Users/benoitcorvol/chatbot/chatbot/docs/technical-spec-Agent-IA-L-Agence-des-Copines-2025-11-03.md`

### Test Scenarios Matrix (Detailed)

#### Epic 1: Infrastructure & Development Environment

| Story       | Scenario                                                     | Test Level | Priority | Risk Link | Notes                                  |
| ----------- | ------------------------------------------------------------ | ---------- | -------- | --------- | -------------------------------------- |
| INFRA-001   | VPS accessible via SSH                                       | Manual     | P0       | R-010     | Pre-deployment validation              |
| INFRA-002   | Docker and Docker Compose installed                          | Manual     | P0       | R-010     | Run `docker --version`                 |
| INFRA-003   | Nginx installed and running                                  | Manual     | P0       | R-010     | Run `sudo systemctl status nginx`      |
| INFRA-004   | SSL certificate valid and auto-renewing                      | Ops        | P2       | R-010     | Certbot cron job verification          |
| INFRA-005   | Supabase project created with pgvector extension             | Manual     | P0       | R-007     | Run `SELECT * FROM pg_extension;`      |
| INFRA-006   | n8n deployed and accessible via https://chat.../n8n/         | Manual     | P0       | R-006     | Login to n8n UI                        |
| INFRA-007   | Domain chat.lagencedescopines.com resolves to VPS IP         | Manual     | P0       | R-010     | Run `dig chat.lagencedescopines.com`   |

#### Epic 2: Chat Widget UI

| Story       | Scenario                                                     | Test Level | Priority | Risk Link | Notes                                  |
| ----------- | ------------------------------------------------------------ | ---------- | -------- | --------- | -------------------------------------- |
| WIDGET-001  | Shadow DOM prevents Kajabi CSS conflicts                    | E2E        | P0       | R-008     | Test on actual Kajabi staging          |
| WIDGET-002  | Floating button (60x60px, rose #f29b9b) visible bottom-right | E2E        | P0       | R-008     | Visual regression                      |
| WIDGET-003  | Click button opens 400x600px popup on desktop                | E2E        | P0       | R-008     | Viewport ≥768px                        |
| WIDGET-004  | Click button opens fullscreen overlay on mobile              | E2E        | P0       | R-013     | Viewport <768px                        |
| WIDGET-005  | User sends message via Enter key                             | E2E        | P0       | R-002     | Happy path                             |
| WIDGET-006  | User sends message via Send button click                     | E2E        | P0       | R-002     | Happy path                             |
| WIDGET-007  | Bot response displayed with typing indicator                 | E2E        | P0       | R-002     | Animated dots bubble                   |
| WIDGET-008  | Conversation persists after page reload                      | E2E        | P0       | R-007     | localStorage + Supabase                |
| WIDGET-009  | Auto-generates UUID for new users on first visit             | E2E        | P0       | R-007     | Check localStorage lac_user_id         |
| WIDGET-010  | Error message displayed on API failure                       | E2E        | P1       | R-006     | Mock 500 error from n8n                |
| WIDGET-011  | Retry button shown on network error                          | E2E        | P1       | R-006     | Mock network disconnection             |
| WIDGET-012  | 5-minute message cache reduces API calls                     | Unit       | P2       | -         | Test cache expiration logic            |
| WIDGET-013  | Widget bundle size <50kb minified + gzipped                  | Unit       | P0       | R-005     | Build artifact verification            |
| WIDGET-014  | Widget loads in <2 seconds on first render                   | E2E        | P1       | R-005     | Lighthouse performance                 |
| WIDGET-015  | Mobile landscape orientation displays correctly              | E2E        | P1       | R-013     | iPhone, Android devices                |
| WIDGET-016  | Keyboard navigation works (Tab, Enter, Esc)                  | E2E        | P2       | -         | Accessibility                          |
| WIDGET-017  | ARIA labels present for screen readers                       | E2E        | P2       | -         | Axe-core validation                    |
| WIDGET-018  | Contrast ratio ≥4.5:1 (WCAG AA)                              | E2E        | P2       | -         | Axe-core validation                    |
| WIDGET-019  | Brand colors match (rose #f29b9b, brun #493f3c)              | E2E        | P2       | R-014     | Visual regression                      |
| WIDGET-020  | Debug logging works when lac_debug=true                      | Unit       | P3       | -         | Console output verification            |

#### Epic 3: n8n AI Orchestration Backend

| Story       | Scenario                                                     | Test Level | Priority | Risk Link | Notes                                  |
| ----------- | ------------------------------------------------------------ | ---------- | -------- | --------- | -------------------------------------- |
| N8N-001     | Webhook receives message from widget                         | API        | P0       | R-002     | POST /webhook/chat                     |
| N8N-002     | Validate conversationId (UUID v4 format)                     | API        | P0       | R-002     | Invalid UUID returns 400               |
| N8N-003     | Validate userId (UUID v4 format)                             | API        | P0       | R-002     | Invalid UUID returns 400               |
| N8N-004     | Validate message length (1-2000 characters)                  | API        | P0       | R-002     | <1 or >2000 returns 400                |
| N8N-005     | Load last 10 messages from Supabase                          | API        | P0       | R-007     | Conversation history context           |
| N8N-006     | Keyword "création" routes to Creation Agent                  | API        | P1       | R-017     | Agent selection logic                  |
| N8N-007     | Keyword "automatisation" routes to Automation Agent          | API        | P1       | R-017     | Agent selection logic                  |
| N8N-008     | Keyword overlap resolved (prioritize first match)            | API        | P1       | R-017     | "création automation" → Creation       |
| N8N-009     | RAG query generates embedding (OpenAI)                       | API        | P1       | R-011     | text-embedding-3-small                 |
| N8N-010     | RAG query searches pgvector (top 20 results)                 | API        | P1       | R-011     | Cosine similarity                      |
| N8N-011     | Cohere reranks top 20 → top 3 results                        | API        | P1       | R-011     | rerank-english-v3.0                    |
| N8N-012     | Context assembled: history + RAG + agent prompt              | Unit       | P2       | -         | Prompt formatting                      |
| N8N-013     | Claude API call (claude-3-5-sonnet, max 1000 tokens)         | API        | P0       | R-004     | Response validation                    |
| N8N-014     | Loop detection identifies >6 similar messages                | API        | P1       | R-009     | Semantic similarity >0.8               |
| N8N-015     | Upsell message triggered on loop detection                   | API        | P1       | R-009     | French upsell text                     |
| N8N-016     | User message saved to Supabase messages table                | API        | P2       | -         | Database schema validation             |
| N8N-017     | Bot response saved to Supabase messages table                | API        | P2       | -         | Database schema validation             |
| N8N-018     | JSON response returned to widget                             | API        | P0       | R-002     | {response, agentType, conversationId}  |
| N8N-019     | Rate limit enforced: 10 messages per minute per conversationId | API        | P0       | R-002     | 11th message returns 429               |
| N8N-020     | Rate limit returns HTTP 429 with French error message        | API        | P0       | R-002     | "Trop de messages envoyés..."          |
| N8N-021     | Claude API timeout handled gracefully (>8s)                  | API        | P0       | R-004     | Retry + fallback response              |
| N8N-022     | n8n workflow failure returns 500 with user-friendly error    | API        | P1       | R-006     | Not stack trace                        |

#### Epic 4: RAG Knowledge Base & Testing

| Story       | Scenario                                                     | Test Level | Priority | Risk Link | Notes                                  |
| ----------- | ------------------------------------------------------------ | ---------- | -------- | --------- | -------------------------------------- |
| RAG-001     | PDF document ingested and text extracted (pdfplumber)        | Unit       | P1       | R-012     | Test with sample PDF                   |
| RAG-002     | Excel file ingested and cells concatenated (pandas)          | Unit       | P1       | R-012     | Test with .xlsx and .xls               |
| RAG-003     | Image text extracted via OCR (Tesseract)                     | Unit       | P1       | R-012     | Test with .jpg and .png                |
| RAG-004     | Text file ingested (.txt, .md)                               | Unit       | P1       | R-012     | Direct read                            |
| RAG-005     | Word document ingested (.docx)                               | Unit       | P1       | R-012     | python-docx extraction                 |
| RAG-006     | Text chunked (500 tokens, 50 overlap, sentence boundaries)   | Unit       | P1       | R-012     | Verify chunk quality                   |
| RAG-007     | Embeddings generated (OpenAI text-embedding-3-small)         | Unit       | P1       | R-011     | 1536 dimensions                        |
| RAG-008     | Document chunks stored in Supabase with embeddings           | API        | P1       | R-011     | pgvector table                         |
| RAG-009     | Vector similarity search returns relevant results            | API        | P1       | R-011     | Query accuracy testing                 |
| RAG-010     | User A cannot access User B's private documents              | API        | P0       | R-003     | Data isolation security test           |
| RAG-011     | Query performance <3s for pgvector search                    | API        | P1       | R-011     | Index optimization                     |

#### Integration & Performance Testing

| Story       | Scenario                                                     | Test Level | Priority | Risk Link | Notes                                  |
| ----------- | ------------------------------------------------------------ | ---------- | -------- | --------- | -------------------------------------- |
| PERF-001    | 50 concurrent users achieve <10s response time               | E2E Load   | P0       | R-004     | Artillery or k6                        |
| PERF-002    | Widget load time <2s on first render                         | E2E        | P1       | R-005     | Lighthouse score ≥90                   |
| PERF-003    | End-to-end message response time <10s (widget → n8n → Claude → widget) | E2E        | P0       | R-004     | Average of 20 requests                 |
| PERF-004    | RAG query performance <3s (embed + pgvector + rerank)        | API        | P1       | R-011     | Measure each step                      |
| SEC-001     | CORS headers allow only Kajabi origin                        | API        | P0       | R-001     | Reject other origins                   |
| SEC-002     | XSS prevention: user input escaped before rendering          | E2E        | P0       | R-001     | Inject <script>alert('XSS')</script>   |
| SEC-003     | Rate limiting prevents API cost overruns                     | API        | P0       | R-002     | Send 100 requests in 1 minute          |
| SEC-004     | UUID validation rejects malformed IDs                        | API        | P0       | R-002     | Test with invalid UUIDs                |
| SEC-005     | RAG query filters by user_id (data isolation)                | API        | P0       | R-003     | Multi-user scenario                    |

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
