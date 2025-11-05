# Architecture v2 - Système Dual-Agent avec RAG Séparé

Version finale optimisée avec:
- **Audrey**: Expert Automation & Tunnels (avec SA base de connaissances)
- **Carole**: Expert Création & Instagram (avec SA base de connaissances)
- **OpenRouter**: Routing intelligent multi-modèles
- **RAG séparé**: Chaque agent a son propre knowledge vectorisé
- **Concurrence optimisée**: Async + parallel processing

---

## 🎯 Les Vraies Expertes

### Audrey - Automation & Tunnels de Vente

**Expertise**:
- Tunnels de vente (funnels) et automatisation marketing
- Email marketing et séquences automatisées
- Outils techniques: Kajabi, Zapier, ActiveCampaign, Systeme.io
- Stratégies de conversion et optimisation
- Analytics, tracking, et métriques
- Processus et systèmes scalables
- Tech setup pour solopreneurs

**Persona**:
- Structurée, claire, pédagogue
- Simplifie la tech pour les non-techniques
- Donne des étapes concrètes à suivre
- Métaphores simples pour concepts complexes
- Style: professionnel mais chaleureux

**Base de connaissances Audrey** (dans Supabase):
```sql
-- Tag documents par agent
UPDATE documents
SET agent_owner = 'audrey',
    tags = ARRAY['automation', 'funnel', 'email', 'tech', 'conversion']
WHERE filename LIKE '%automation%'
   OR filename LIKE '%funnel%'
   OR filename LIKE '%email%'
   OR filename LIKE '%kajabi%';
```

---

### Carole - Création & Instagram

**Expertise**:
- Stratégie Instagram (reels, stories, posts, carrousels)
- Création de contenu engageant et viral
- Storytelling et copywriting authentique
- Branding et identité visuelle cohérente
- Planification éditoriale (calendrier contenu)
- Community management et engagement
- Hooks et scripts accrocheurs

**Persona**:
- Créative, inspirante, enthousiaste
- Utilise emojis naturellement (🎨✨📸💡)
- Exemples concrets et visuels
- Encourage et motive
- Style: friendly et motivant

**Base de connaissances Carole** (dans Supabase):
```sql
-- Tag documents par agent
UPDATE documents
SET agent_owner = 'carole',
    tags = ARRAY['instagram', 'contenu', 'branding', 'storytelling', 'social']
WHERE filename LIKE '%instagram%'
   OR filename LIKE '%contenu%'
   OR filename LIKE '%reel%'
   OR filename LIKE '%branding%';
```

---

## 🔄 Architecture Complète

```
User Message (widget)
    ↓
[Webhook n8n] - Validation & Rate Limit
    ↓
[Parallel Processing]
    ├─── Load History (Supabase)
    │
    └─── Initial Context Analysis
         (Quick LLM call pour comprendre intent)
    ↓
[Agent Orchestrator] ← LLM décide
    Input: message + history + quick_analysis
    Output: { agent: "audrey" | "carole", confidence: 0-1, reasoning: "..." }
    ↓
[Route Switch]
    ├─── AUDREY PATH
    │    ├─ RAG Pipeline Audrey (sa knowledge base)
    │    │  ├─ Embedding (OpenAI)
    │    │  ├─ Vector Search (filter: agent_owner='audrey')
    │    │  └─ Rerank (Cohere) → top 3
    │    │
    │    └─ Audrey Agent (OpenRouter)
    │       Model: anthropic/claude-3.5-sonnet
    │       Prompt: Audrey persona + RAG + history
    │
    └─── CAROLE PATH
         ├─ RAG Pipeline Carole (sa knowledge base)
         │  ├─ Embedding (OpenAI)
         │  ├─ Vector Search (filter: agent_owner='carole')
         │  └─ Rerank (Cohere) → top 3
         │
         └─ Carole Agent (OpenRouter)
            Model: anthropic/claude-3.5-sonnet
            Prompt: Carole persona + RAG + history
    ↓
[Post-Processing]
    ├─ Loop Detection
    ├─ Sentiment Analysis
    ├─ Upsell Trigger Detection
    └─ Response Formatting
    ↓
[Save Messages - Async]
    ├─ User message → Supabase
    ├─ Agent response → Supabase
    └─ Metadata (agent, confidence, rag_sources)
    ↓
[Response to Widget]
    {
      response: "...",
      agent: "audrey",
      sources: ["doc1", "doc2"],
      confidence: 0.95
    }
```

---

## 🔮 Agent Orchestrateur Intelligent

### Système Prompt

```python
ORCHESTRATOR_PROMPT = """
Tu es l'orchestrateur intelligent pour L'Agence des Copines.

Tu analyses chaque demande et décides QUI est la meilleure personne pour répondre:

👩‍💼 AUDREY - Experte Automation & Tunnels:
- Funnels de vente et automatisation
- Email marketing et séquences
- Outils tech: Kajabi, Zapier, ActiveCampaign
- Conversion et analytics
- Processus et systématisation
- Configuration technique

🎨 CAROLE - Experte Création & Instagram:
- Stratégie Instagram (reels, stories, posts)
- Création de contenu viral
- Storytelling et copywriting
- Branding et design
- Planification éditoriale
- Community management

ANALYSE:
1. Lis le message utilisateur
2. Regarde l'historique conversation
3. Identifie le besoin PRINCIPAL
4. Considère le contexte métier (professionnels bien-être)

RÈGLES DE DÉCISION:
- Si automatisation, tech, funnels, emails → AUDREY
- Si contenu, Instagram, branding, storytelling → CAROLE
- Si mixte, choisis selon l'URGENCE mentionnée
- Si vraiment 50/50, préfère CAROLE (point d'entrée création)
- Si hors scope ou complexe → ESCALATE

RETOURNE JSON STRICT:
{
  "agent": "audrey" | "carole" | "escalate",
  "confidence": 0.0-1.0,
  "primary_need": "description courte",
  "secondary_needs": ["besoin2", "besoin3"],
  "reasoning": "explication décision en 1 phrase"
}

Si confidence < 0.7 → "escalate"
"""
```

### Implémentation

```python
import openai
import json

async def orchestrate_agent(user_message: str, history: list) -> dict:
    """
    Décide quel agent (Audrey ou Carole) doit répondre.
    """

    # Format history pour context
    history_text = "\n".join([
        f"{msg['role']}: {msg['content'][:100]}..."
        for msg in history[-5:]  # Last 5 messages seulement
    ])

    # Call OpenRouter avec modèle rapide
    response = await call_openrouter(
        model="anthropic/claude-3-haiku",  # Rapide + pas cher
        messages=[
            {"role": "system", "content": ORCHESTRATOR_PROMPT},
            {"role": "user", "content": f"""
MESSAGE UTILISATEUR:
{user_message}

HISTORIQUE RÉCENT:
{history_text}

DÉCIDE: Audrey ou Carole?
"""}
        ],
        temperature=0.3,  # Bas pour classification
        max_tokens=200
    )

    # Parse JSON
    decision = json.loads(response["choices"][0]["message"]["content"])

    return decision
```

---

## 🔍 Pipeline RAG Dual (Séparé par Agent)

### Schema Database Étendu

```sql
-- Étendre table documents pour ownership
ALTER TABLE documents
ADD COLUMN agent_owner TEXT CHECK (agent_owner IN ('audrey', 'carole', 'shared')),
ADD COLUMN tags TEXT[],
ADD COLUMN category TEXT,
ADD COLUMN priority INTEGER DEFAULT 1;

-- Étendre document_chunks pour metadata
ALTER TABLE document_chunks
ADD COLUMN keywords TEXT[],
ADD COLUMN relevance_score FLOAT DEFAULT 1.0;

-- Index pour filtrage rapide
CREATE INDEX idx_documents_agent ON documents(agent_owner);
CREATE INDEX idx_chunks_keywords ON document_chunks USING GIN(keywords);
```

### RAG Pipeline Audrey

```python
async def rag_audrey(query: str) -> str:
    """
    RAG pipeline spécifique à Audrey (automation knowledge).
    """

    # 1. Generate embedding
    embedding = await openai_embed(query)

    # 2. Vector search FILTRÉ sur Audrey
    chunks = await supabase.rpc('match_documents_audrey', {
        'query_embedding': embedding,
        'match_threshold': 0.7,
        'match_count': 20,
        'agent_filter': 'audrey'
    })

    if not chunks:
        return "[Aucune ressource spécifique trouvée dans la base Audrey]"

    # 3. Rerank avec Cohere
    reranked = await cohere_rerank(
        query=query,
        documents=[c['content'] for c in chunks],
        top_n=3,
        model="rerank-multilingual-v3.0"
    )

    # 4. Format context
    context = "\n\n---\n\n".join([
        f"📚 Source: {chunk.metadata['filename']}\n{chunk.text}"
        for chunk in reranked
    ])

    return context
```

### RAG Pipeline Carole

```python
async def rag_carole(query: str) -> str:
    """
    RAG pipeline spécifique à Carole (création knowledge).
    """

    # 1. Generate embedding
    embedding = await openai_embed(query)

    # 2. Vector search FILTRÉ sur Carole
    chunks = await supabase.rpc('match_documents_carole', {
        'query_embedding': embedding,
        'match_threshold': 0.7,
        'match_count': 20,
        'agent_filter': 'carole'
    })

    if not chunks:
        return "[Aucune ressource spécifique trouvée dans la base Carole]"

    # 3. Rerank avec Cohere
    reranked = await cohere_rerank(
        query=query,
        documents=[c['content'] for c in chunks],
        top_n=3,
        model="rerank-multilingual-v3.0"
    )

    # 4. Format context
    context = "\n\n---\n\n".join([
        f"🎨 Source: {chunk.metadata['filename']}\n{chunk.text}"
        for chunk in reranked
    ])

    return context
```

### Supabase Functions

```sql
-- Function pour Audrey
CREATE OR REPLACE FUNCTION match_documents_audrey(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  agent_filter text DEFAULT 'audrey'
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  filename text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.filename
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (d.agent_owner = agent_filter OR d.agent_owner = 'shared')
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function pour Carole (identique, juste le filtre change)
CREATE OR REPLACE FUNCTION match_documents_carole(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  agent_filter text DEFAULT 'carole'
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  filename text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.filename
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (d.agent_owner = agent_filter OR d.agent_owner = 'shared')
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 👩‍💼 Agent Audrey - Prompt Complet

```python
AUDREY_SYSTEM_PROMPT = """
Tu es Audrey, experte en automation et tunnels de vente pour L'Agence des Copines.

🎯 TON EXPERTISE:
- Funnels de vente (lead magnets, tripwires, upsells)
- Email marketing et séquences automatisées
- Outils tech: Kajabi, Zapier, ActiveCampaign, Systeme.io, ClickFunnels
- Stratégies de conversion (CTR, taux ouverture, A/B testing)
- Analytics et tracking (pixels, UTM, événements)
- Processus scalables pour solopreneurs
- Intégrations et automatisations

💼 TON STYLE:
- Structurée et méthodique
- Tu simplifies la tech avec pédagogie
- Tu donnes des étapes concrètes: 1, 2, 3...
- Tu rassures sur la faisabilité technique
- Tu utilises des métaphores simples
- Ton style: professionnel mais accessible
- Tu écris en français "tu"

👥 TES CLIENTS:
- Professionnels du bien-être (coachs, thérapeutes, praticiens)
- Solopreneurs cherchant à automatiser
- Souvent novices en tech
- Besoin de systématiser leur acquisition clients
- Veulent des process clairs step-by-step

📚 TES RESSOURCES (base de connaissances Audrey):
{rag_context}

💬 CONVERSATION PRÉCÉDENTE:
{history}

🎯 TON RÔLE:
1. Comprends le besoin technique/automation
2. Décompose en étapes simples et actionnables
3. Explique le "pourquoi" avant le "comment"
4. Donne des templates ou frameworks quand possible
5. Propose des quick wins rapides à implémenter
6. Si besoin approfondi → suggère accompagnement

⚡ RÈGLES:
- Maximum 300 mots
- Structure claire (listes, numéros)
- Pas de jargon technique sans explication
- Toujours donner une action concrète
- Référence tes ressources si pertinent
- Ton chaleureux mais pro

RÉPONDS MAINTENANT en tant qu'Audrey:
"""
```

---

## 🎨 Agent Carole - Prompt Complet

```python
CAROLE_SYSTEM_PROMPT = """
Tu es Carole, experte en création de contenu Instagram pour L'Agence des Copines.

🎯 TON EXPERTISE:
- Stratégie Instagram complète (reels, stories, posts, carrousels)
- Création de contenu viral et engageant
- Storytelling authentique et captivant
- Branding visuel et cohérence esthétique
- Planification éditoriale (calendrier, thèmes)
- Hooks et copywriting accrocheurs
- Community management et croissance organique
- Analyse de métriques contenu

🎨 TON STYLE:
- Créative et inspirante ✨
- Enthousiaste et motivante 🎉
- Tu utilises des emojis naturellement 🎨📸💡
- Tu donnes des exemples concrets et visuels
- Tu encourages et célèbres les victoires
- Ton style: friendly, warm, motivant
- Tu écris en français "tu"

👥 TES CLIENTS:
- Professionnels du bien-être (coachs, thérapeutes, praticiens)
- Solopreneurs voulant développer leur présence Instagram
- Besoin de créer du contenu régulier et impactant
- Souvent bloqués par le syndrome page blanche
- Cherchent authenticité et connexion

📚 TES RESSOURCES (base de connaissances Carole):
{rag_context}

💬 CONVERSATION PRÉCÉDENTE:
{history}

🎯 TON RÔLE:
1. Comprends le besoin créatif/stratégique
2. Donne des idées concrètes et actionnables immédiatement
3. Propose des exemples et templates de contenu
4. Inspire et débloque la créativité
5. Partage des hooks/accroches qui marchent
6. Si demande approfondie → suggère formation/accompagnement

⚡ RÈGLES:
- Maximum 300 mots
- Énergétique et inspirant
- Exemples concrets de posts/reels
- Toujours donner une idée actionnable
- Référence tes ressources si pertinent
- Emojis naturels (pas trop!)

RÉPONDS MAINTENANT en tant que Carole:
"""
```

---

## 🚀 OpenRouter Integration

### Client OpenRouter

```python
import httpx
import asyncio
from typing import Optional, Dict, List

class OpenRouterClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"
        self.client = httpx.AsyncClient(timeout=30.0)

        # Model routing strategy
        self.models = {
            "orchestrator": "anthropic/claude-3-haiku",  # Fast classification
            "audrey": "anthropic/claude-3.5-sonnet",     # Quality for complex
            "carole": "anthropic/claude-3.5-sonnet",     # Quality for creative
            "fallback": "openai/gpt-4o-mini"             # Si tout down
        }

    async def chat_completion(
        self,
        messages: List[Dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> Dict:
        """
        Call OpenRouter API with fallback logic.
        """
        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://lagencedescopines.com",
                    "X-Title": "L'Agence des Copines Chatbot"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    **kwargs
                }
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            # Fallback si modèle down
            if e.response.status_code >= 500:
                print(f"Model {model} down, trying fallback...")
                return await self.chat_completion(
                    messages=messages,
                    model=self.models["fallback"],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            raise

    async def orchestrate(self, user_message: str, history: list) -> dict:
        """Orchestrator call."""
        response = await self.chat_completion(
            messages=[
                {"role": "system", "content": ORCHESTRATOR_PROMPT},
                {"role": "user", "content": f"Message: {user_message}\nHistory: {history}"}
            ],
            model=self.models["orchestrator"],
            temperature=0.3,
            max_tokens=200
        )
        return json.loads(response["choices"][0]["message"]["content"])

    async def audrey_response(self, user_message: str, history: list, rag_context: str) -> str:
        """Audrey agent call."""
        prompt = AUDREY_SYSTEM_PROMPT.format(
            rag_context=rag_context,
            history=format_history(history)
        )

        response = await self.chat_completion(
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
            ],
            model=self.models["audrey"],
            temperature=0.7,
            max_tokens=1000
        )
        return response["choices"][0]["message"]["content"]

    async def carole_response(self, user_message: str, history: list, rag_context: str) -> str:
        """Carole agent call."""
        prompt = CAROLE_SYSTEM_PROMPT.format(
            rag_context=rag_context,
            history=format_history(history)
        )

        response = await self.chat_completion(
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
            ],
            model=self.models["carole"],
            temperature=0.7,
            max_tokens=1000
        )
        return response["choices"][0]["message"]["content"]
```

---

## ⚡ Optimisations Concurrence

### Main Handler Async

```python
async def handle_message(
    user_message: str,
    conversation_id: str,
    user_id: str
) -> dict:
    """
    Main async handler avec parallélisation optimale.
    """

    # Step 1: Parallel fetch de history et orchestration
    history_task = asyncio.create_task(
        load_conversation_history(conversation_id, limit=10)
    )

    # Wait history avant orchestration
    history = await history_task

    # Step 2: Orchestrator décide
    decision = await openrouter.orchestrate(user_message, history)

    if decision["agent"] == "escalate":
        return {
            "response": "Je vais transférer ta demande à l'équipe humaine qui pourra mieux t'aider! 🤝",
            "agent": "escalate",
            "next_action": "human_handoff"
        }

    # Step 3: Agent-specific RAG + Response (parallel)
    if decision["agent"] == "audrey":
        rag_context = await rag_audrey(user_message)
        response = await openrouter.audrey_response(user_message, history, rag_context)
    else:  # carole
        rag_context = await rag_carole(user_message)
        response = await openrouter.carole_response(user_message, history, rag_context)

    # Step 4: Post-process
    loop_detected = detect_conversation_loop(history + [{"role": "user", "content": user_message}])

    if loop_detected:
        response += "\n\n💡 Tu as beaucoup de questions approfondies! Notre formation pourrait t'intéresser pour un accompagnement personnalisé."

    # Step 5: Save messages (async, non-bloquant)
    asyncio.create_task(
        save_messages(conversation_id, user_message, response, decision["agent"])
    )

    return {
        "response": response,
        "agent": decision["agent"],
        "confidence": decision["confidence"],
        "loop_detected": loop_detected
    }
```

### Timing Attendu

```
├─ Load history: 150ms
├─ Orchestrator: 400ms (Haiku rapide)
├─ RAG pipeline: 800ms
│  ├─ Embedding: 100ms
│  ├─ Vector search: 200ms
│  └─ Rerank: 500ms
├─ Agent response: 2-3s (Sonnet)
├─ Post-process: 50ms
└─ Save (async): 200ms (non-bloquant)

TOTAL PERÇU PAR USER: ~3.5-4.5s ✅
```

---

## 📊 Métriques & Monitoring

### Logs Structurés

```python
{
  "timestamp": "2025-11-03T12:00:00Z",
  "conversation_id": "uuid",
  "user_message_length": 150,
  "orchestrator_decision": {
    "agent": "carole",
    "confidence": 0.92,
    "reasoning": "Question sur stratégie Instagram"
  },
  "rag_results": {
    "chunks_found": 20,
    "reranked_top_3": ["doc1", "doc2", "doc3"],
    "sources": ["Formation Insta Pro", "Guide Reels"]
  },
  "agent_response_length": 280,
  "total_time_ms": 3850,
  "model_used": "anthropic/claude-3.5-sonnet",
  "tokens_used": {
    "prompt": 1200,
    "completion": 350
  },
  "cost_usd": 0.018
}
```

---

## 🎯 Prochaines Étapes

Je vais créer:

1. ✅ Architecture documentée
2. 📝 `backend/agents.py` - Code complet agents
3. 📝 `backend/rag_pipeline.py` - Pipeline RAG dual
4. 📝 `backend/orchestrator.py` - Orchestration logique
5. 📝 `backend/openrouter_client.py` - Client OpenRouter
6. 📝 `backend/main.py` - FastAPI endpoint (alternative n8n)
7. 📝 `n8n/workflow-v2.json` - Workflow n8n optimisé
8. 📝 `deployment/setup.md` - Guide déploiement complet

**Tu préfères quoi?**
- A) Tout en Python (FastAPI) → Plus rapide, plus performant
- B) Hybride: n8n orchestre + Python nodes
- C) Pur n8n avec Code nodes

Dis-moi et je code tout! 🚀
