# Architecture n8n Réelle - Version Optimisée

Refonte complète avec vraie logique métier, OpenRouter, RAG complet, et concurrence.

---

## 🚨 Problèmes de l'Ancienne Version

### Ce qui n'allait pas:

1. **Routage simpliste**: Keywords basiques → pas intelligent
2. **Pas de RAG**: Placeholder vide → pas d'utilisation de la base de connaissances
3. **Anthropic direct**: Coûteux, pas flexible
4. **Pas de reranker**: Top 20 chunks envoyés directement → context bloat
5. **Pas optimisé concurrence**: Workflow synchrone bloquant
6. **Agents génériques**: "Creation/Automation" → pas Audrey/Carole

---

## ✅ Nouvelle Architecture

### Vue d'ensemble

```
Widget (user message)
    ↓
[Webhook n8n] → Rate limit check
    ↓
[Load history + parallel RAG] ← Optimisation concurrence
    ├─ History: 10 messages (Supabase)
    └─ RAG: embedding → vector search → rerank
    ↓
[Agent Orchestrator] ← LLM décide (pas keywords!)
    ├─ Analyse: message + history + user profile
    ├─ Décision: Audrey, Carole, ou escalation
    └─ Reasoning: pourquoi ce choix
    ↓
[Agent Spécialisé] (Audrey OU Carole)
    ├─ Prompt personnalisé avec persona
    ├─ Context: history + RAG + orchestrator reasoning
    └─ OpenRouter: claude-3.5-sonnet OU gpt-4o (fallback)
    ↓
[Post-processing]
    ├─ Loop detection
    ├─ Save messages (parallel)
    └─ Response formatting
    ↓
Widget (response avec metadata)
```

---

## 🧠 Agent Orchestrateur (Le Cerveau)

### Rôle

Décide intelligemment qui doit répondre: Audrey ou Carole.

### Logique

```python
# Pas de keywords! On utilise un LLM pour décider

system_prompt = """
Tu es l'orchestrateur intelligent pour L'Agence des Copines.
Tu analyses la demande de l'utilisateur et décides qui est le mieux placé
pour répondre : Audrey ou Carole.

AUDREY - Experte Création & Contenu Instagram:
- Stratégie Instagram (reels, stories, posts)
- Création de contenu engageant
- Branding et identité visuelle
- Storytelling et copywriting
- Community management
- Design et esthétique

CAROLE - Experte Automation & Tunnels de Vente:
- Funnels de vente et automatisation
- Email marketing et séquences
- Outils techniques (Kajabi, Zapier, etc.)
- Stratégie de conversion
- Systèmes et processus
- Analytics et optimisation

ANALYSE:
1. Lis le message de l'utilisateur
2. Regarde l'historique de conversation
3. Identifie le besoin principal

DÉCISION:
Retourne un JSON strictement formaté:
{
  "agent": "audrey" | "carole" | "escalate",
  "confidence": 0.0-1.0,
  "reasoning": "explication courte",
  "keywords_detected": ["mot1", "mot2"]
}

Si incertain (confidence < 0.7), choisis "escalate".
"""

# Appel à OpenRouter avec modèle rapide et pas cher
model = "anthropic/claude-3-haiku" # Rapide pour classification
response = openrouter_api.call(
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Message: {user_message}\n\nHistorique: {history}"}
    ],
    temperature=0.3, # Bas pour classification déterministe
    max_tokens=150
)

decision = json.loads(response)
```

---

## 🎯 Agents Spécialisés

### Audrey - Création & Instagram

```python
audrey_prompt = """
Tu es Audrey, experte en création de contenu Instagram pour L'Agence des Copines.

TA PERSONNALITÉ:
- Créative, inspirante, et chaleureuse
- Tu parles avec enthousiasme de stratégie de contenu
- Tu utilises des emojis naturellement (🎨✨📸)
- Tu donnes des exemples concrets et visuels
- Ton style: friendly et motivant

TON EXPERTISE:
- Stratégie Instagram (reels, stories, posts, carrousels)
- Création de contenu qui engage
- Storytelling authentique
- Branding et cohérence visuelle
- Planification éditoriale
- Hooks et copywriting accrocheurs

CONTEXTE UTILISATEUR:
- Professionnels du bien-être (coachs, thérapeutes, praticiens)
- Solopreneurs qui veulent développer leur présence Instagram
- Besoin de créer du contenu régulier et impactant

TON RÔLE:
1. Comprends le besoin spécifique
2. Donne des conseils actionnables immédiatement
3. Propose des idées créatives et exemples
4. Encourage et motive
5. Réfère à la formation si demande approfondie

UTILISE CES RESSOURCES (RAG):
{rag_context}

CONVERSATION PRÉCÉDENTE:
{history}

RÉPONDS EN FRANÇAIS avec le ton d'Audrey. Maximum 250 mots.
"""
```

### Carole - Automation & Tunnels

```python
carole_prompt = """
Tu es Carole, experte en automatisation marketing pour L'Agence des Copines.

TA PERSONNALITÉ:
- Structurée, claire, et pragmatique
- Tu simplifies le technique avec pédagogie
- Tu donnes des étapes concrètes à suivre
- Tu utilises des métaphores simples pour expliquer
- Ton style: professionnel mais accessible

TON EXPERTISE:
- Tunnels de vente (funnels) et automatisation
- Email marketing et séquences
- Outils techniques (Kajabi, Zapier, Active Campaign)
- Systèmes de conversion
- Analytics et tracking
- Optimisation de processus

CONTEXTE UTILISATEUR:
- Professionnels du bien-être voulant automatiser
- Besoin de systématiser leur acquisition clients
- Souvent novices en technique
- Veulent des processus clairs step-by-step

TON RÔLE:
1. Décompose les problèmes techniques en étapes simples
2. Explique le "pourquoi" avant le "comment"
3. Donne des templates et frameworks
4. Rassure sur la faisabilité technique
5. Propose des quick wins rapides

UTILISE CES RESSOURCES (RAG):
{rag_context}

CONVERSATION PRÉCÉDENTE:
{history}

RÉPONDS EN FRANÇAIS avec le ton de Carole. Maximum 250 mots.
"""
```

---

## 🔍 Pipeline RAG Complet

### Étape 1: Generate Embedding

```python
import openai

# OpenAI embeddings (rapide et pas cher)
embedding = openai.Embedding.create(
    model="text-embedding-3-small",
    input=user_message
)["data"][0]["embedding"]

# Dimension: 1536
```

### Étape 2: Vector Search (Supabase pgvector)

```sql
-- Query Supabase avec cosine similarity
SELECT
    dc.content,
    d.filename,
    dc.chunk_index,
    1 - (dc.embedding <=> $1::vector) as similarity
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
ORDER BY dc.embedding <=> $1::vector
LIMIT 20;
```

### Étape 3: Rerank avec Cohere

```python
import cohere

co = cohere.Client(api_key=COHERE_API_KEY)

# Rerank top 20 → top 3
reranked = co.rerank(
    model="rerank-multilingual-v3.0", # Supporte français!
    query=user_message,
    documents=[chunk["content"] for chunk in top_20_chunks],
    top_n=3
)

# Format pour Claude
rag_context = "\n\n---\n\n".join([
    f"[Source: {chunk.filename}]\n{chunk.content}"
    for chunk in reranked.results
])
```

---

## 🚀 Optimisations Concurrence

### Problème Original

```
Webhook → Load history (wait) → RAG embedding (wait) →
vector search (wait) → rerank (wait) → LLM (wait) → save
```

**Total**: ~8-10 secondes, **bloquant pour chaque user**

### Solution Optimisée

```python
# Paralléliser tout ce qui peut l'être
import asyncio

async def process_message(user_message, conversation_id):
    # Lancer en parallèle
    history_task = asyncio.create_task(load_history(conversation_id))
    rag_task = asyncio.create_task(run_rag_pipeline(user_message))

    # Attendre les deux
    history, rag_context = await asyncio.gather(
        history_task,
        rag_task
    )

    # Maintenant orchestrator
    decision = await orchestrator_call(user_message, history)

    # Agent call
    response = await agent_call(decision["agent"], user_message, history, rag_context)

    # Save en parallèle (fire and forget)
    asyncio.create_task(save_messages(user_message, response))

    # Return immédiatement
    return response
```

**Gain**: ~3-4 secondes, **non-bloquant**

---

## 🔌 Intégration OpenRouter

### Pourquoi OpenRouter?

1. **Fallback automatique**: Claude down → GPT-4
2. **Prix optimisés**: Routing intelligent
3. **Unified API**: Un seul endpoint
4. **No rate limits**: Pas de 429 errors

### Configuration

```python
import requests

OPENROUTER_API_KEY = "sk-or-v1-..."
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

def call_openrouter(messages, model="anthropic/claude-3.5-sonnet", **kwargs):
    response = requests.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://lagencedescopines.com",
            "X-Title": "L'Agence des Copines Chatbot"
        },
        json={
            "model": model,
            "messages": messages,
            **kwargs
        }
    )
    return response.json()

# Usage
response = call_openrouter(
    messages=[
        {"role": "system", "content": audrey_prompt},
        {"role": "user", "content": user_message}
    ],
    temperature=0.7,
    max_tokens=1000
)
```

### Models Disponibles

```python
MODELS = {
    "orchestrator": "anthropic/claude-3-haiku",  # Rapide, pas cher
    "audrey": "anthropic/claude-3.5-sonnet",     # Qualité créative
    "carole": "openai/gpt-4o",                   # Technique précis
    "fallback": "openai/gpt-3.5-turbo"           # Si tout down
}
```

---

## 📊 Structure n8n Optimisée

### Nodes Structure

```
1. Webhook Trigger
    ↓
2. Validate & Rate Limit (Code node - synchrone, rapide)
    ↓
3. Parallel Fetch (Split in Batches node)
    ├─ 3a. Load History (Supabase)
    └─ 3b. RAG Pipeline (HTTP nodes chaînés)
        ├─ Generate embedding (OpenAI)
        ├─ Vector search (Supabase function)
        └─ Rerank (Cohere)
    ↓
4. Merge Results
    ↓
5. Agent Orchestrator (HTTP → OpenRouter)
    ↓
6. Route by Decision (Switch node)
    ├─ 6a. Audrey Agent (HTTP → OpenRouter)
    ├─ 6b. Carole Agent (HTTP → OpenRouter)
    └─ 6c. Escalate (Human handoff)
    ↓
7. Post-process (Code node)
    ├─ Loop detection
    └─ Format response
    ↓
8. Save Messages (Supabase - parallel, fire-and-forget)
    ↓
9. Return Response (Respond to Webhook)
```

### Timing Optimisé

| Étape | Temps | Notes |
|-------|-------|-------|
| Validate | 10ms | Synchrone |
| History + RAG (parallel) | 800ms | Était 1.5s séquentiel |
| Orchestrator | 400ms | Haiku rapide |
| Agent (Audrey/Carole) | 2-3s | Sonnet/GPT-4 |
| Post-process | 50ms | Synchrone |
| Save | 200ms | Async, non-bloquant |
| **TOTAL** | **3.5-4.5s** | ✅ <10s objectif |

---

## 🔥 Prochaines Étapes

Je vais créer:

1. `workflow-v2.json` - Nouveau workflow n8n optimisé
2. `agents.py` - Code Python pour agents (à déployer)
3. `rag_pipeline.py` - Pipeline RAG complet
4. `orchestrator.py` - Logique d'orchestration
5. `openrouter_client.py` - Client OpenRouter
6. `deployment-v2.md` - Guide déploiement

**Questions**:

1. Tu confirmes Audrey = Création et Carole = Automation?
2. Tu as déjà les docs à ingérer pour le RAG?
3. Tu veux que je code tout en Python externe ou garder dans n8n (nodes Code)?
4. OpenRouter API key: tu l'as ou je te guide pour créer?

Dis-moi et je construis la vraie version optimisée! 🚀
