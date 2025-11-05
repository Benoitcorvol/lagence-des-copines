# L'Agence des Copines - Chatbot v2

Backend intelligent avec orchestration d'agents, RAG dual, et intégration OpenRouter.

## 🎯 Architecture

### Agents Spécialisés

**👩‍💼 Audrey** - Experte Automation & Tunnels de Vente
- Funnels de vente et automatisation marketing
- Email marketing et séquences
- Outils: Kajabi, Zapier, ActiveCampaign, Systeme.io
- Analytics et conversion

**🎨 Carole** - Experte Création & Instagram
- Stratégie Instagram (reels, stories, posts)
- Création de contenu viral
- Storytelling et copywriting
- Branding et design

### Flux de Traitement

```
1. Message utilisateur
   ↓
2. Rate limit check
   ↓
3. Load conversation history
   ↓
4. Orchestrateur LLM décide → Audrey | Carole | Escalate
   ↓
5. RAG agent-specific (vector search + rerank)
   ↓
6. Génération réponse avec context
   ↓
7. Save messages (async)
   ↓
8. Return response
```

### Composants Techniques

- **Orchestrateur**: Claude Haiku (rapide, pas cher)
- **Agents**: Claude 3.5 Sonnet (qualité)
- **Embeddings**: OpenAI text-embedding-3-small
- **Reranker**: Cohere rerank-multilingual-v3.0
- **Database**: Supabase (PostgreSQL + pgvector)
- **API**: FastAPI async

## 🚀 Installation

### Prérequis

- Python 3.11+
- Compte Supabase avec base de données configurée
- Clés API: OpenRouter, OpenAI, Cohere

### Configuration

1. **Cloner et installer dépendances**

```bash
cd backend-v2
pip install -r requirements.txt
```

2. **Créer fichier `.env`**

```bash
cp .env.example .env
```

Remplir les valeurs:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

OPENROUTER_API_KEY=sk-or-v1-your-key
OPENAI_API_KEY=sk-your-openai-key
COHERE_API_KEY=your-cohere-key
```

3. **Exécuter migrations database**

Aller dans Supabase → SQL Editor → Copier/coller contenu de `database/migrations.sql` → Run

Cela va:
- Ajouter colonnes `agent_owner`, `tags`, `category` à table `documents`
- Créer fonctions `match_documents_audrey()` et `match_documents_carole()`
- Ajouter colonne `agent` à table `messages`
- Créer fonction `check_rate_limit()`
- Tagger documents existants par agent

4. **Vérifier installation**

```bash
python main.py
```

Devrait démarrer sur http://localhost:8000

## 📚 API Endpoints

### POST /api/chat

Endpoint principal pour envoyer un message.

**Request:**
```json
{
  "user_id": "user-123",
  "conversation_id": "conv-456",
  "message": "Comment créer un reel viral sur Instagram?",
  "timestamp": "2025-11-03T12:00:00Z"
}
```

**Response:**
```json
{
  "conversation_id": "conv-456",
  "message": "✨ Hey! Super question sur les reels viraux...",
  "agent": "carole",
  "confidence": 0.95,
  "reasoning": "Question sur Instagram et création de contenu",
  "timestamp": "2025-11-03T12:00:01Z"
}
```

### GET /api/rate-limit/{conversation_id}

Vérifier le rate limit pour une conversation.

**Response:**
```json
{
  "allowed": true,
  "remaining": 8,
  "limit": 10,
  "window_seconds": 60
}
```

### GET /health

Health check avec status des services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T12:00:00Z",
  "services": {
    "supabase": true,
    "openrouter": true,
    "openai": true,
    "cohere": true
  }
}
```

## 🗄️ Structure Database

### Table: `documents`

Extensions ajoutées:
- `agent_owner` - 'audrey' | 'carole' | 'shared'
- `tags` - TEXT[] pour catégorisation
- `category` - Type de document
- `priority` - Priorité de récupération (1 = haute)

### Table: `messages`

Extensions ajoutées:
- `agent` - Quel agent a répondu ('audrey' | 'carole' | 'escalate')

### Fonctions Supabase

- `match_documents_audrey(embedding, threshold, count)` - Recherche vectorielle filtrée pour Audrey
- `match_documents_carole(embedding, threshold, count)` - Recherche vectorielle filtrée pour Carole
- `check_rate_limit(conversation_id, max_messages, window_seconds)` - Vérification rate limit

## 🧪 Tests

### Test curl basique

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "conversation_id": "test-conv",
    "message": "Comment automatiser mes emails?",
    "timestamp": "2025-11-03T12:00:00Z"
  }'
```

Devrait répondre avec Audrey (automation expert).

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "conversation_id": "test-conv-2",
    "message": "Aide-moi à créer un reel Instagram engageant",
    "timestamp": "2025-11-03T12:00:00Z"
  }'
```

Devrait répondre avec Carole (création expert).

### Test health

```bash
curl http://localhost:8000/health
```

### Test rate limit

```bash
curl http://localhost:8000/api/rate-limit/test-conv
```

## 📊 Monitoring

### Logs

Logs détaillés dans stdout:
- Décisions orchestrateur
- RAG retrieval (nombre de chunks)
- Erreurs et warnings

### Analytics

Requête SQL pour analytics:
```sql
SELECT * FROM agent_analytics
ORDER BY date DESC
LIMIT 30;
```

Montre par jour:
- Messages par agent
- Conversations uniques
- Longueur moyenne des messages

### Métriques Clés

- **Temps réponse**: Objectif <5s
- **Rate limit**: 10 messages/minute/conversation
- **RAG retrieval**: Top 20 → rerank → top 3
- **Confidence threshold**: <0.7 → escalate

## 🔧 Configuration Avancée

### Modifier les modèles

Dans `.env`:
```env
ORCHESTRATOR_MODEL=anthropic/claude-3-haiku
AUDREY_MODEL=anthropic/claude-3.5-sonnet
CAROLE_MODEL=anthropic/claude-3.5-sonnet
FALLBACK_MODEL=openai/gpt-4o-mini
```

### Ajuster RAG

Dans `.env`:
```env
RAG_SIMILARITY_THRESHOLD=0.7  # Minimum similarity
RAG_INITIAL_RESULTS=20        # Résultats avant rerank
RAG_RERANK_TOP_N=3            # Top N après rerank
```

### Rate limiting

Dans `.env`:
```env
RATE_LIMIT_MESSAGES=10        # Max messages
RATE_LIMIT_WINDOW_SECONDS=60  # Par fenêtre de temps
```

## 📦 Déploiement

### Docker (Recommandé)

Créer `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build et run:
```bash
docker build -t chatbot-v2 .
docker run -p 8000:8000 --env-file .env chatbot-v2
```

### Production avec Gunicorn

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## 🐛 Troubleshooting

### Erreur: "No relevant documents found"

- Vérifier que documents sont bien taggés avec `agent_owner`
- Exécuter migrations SQL
- Vérifier embeddings dans table `document_chunks`

### Erreur OpenRouter API

- Vérifier clé API valide
- Tester fallback model configuré
- Logs montreront tentatives de retry

### Rate limit toujours bloqué

- Vérifier fonction `check_rate_limit()` existe dans Supabase
- Tester manuellement: `SELECT * FROM check_rate_limit('test', 10, 60);`

### Performance lente

- Vérifier indexes créés (`idx_documents_agent`, `idx_messages_agent`)
- Monitoring logs pour timing de chaque étape
- Considérer ajuster `RAG_INITIAL_RESULTS` (moins = plus rapide)

## 📞 Support

**Documentation complète**: Voir `/n8n-workflows-v2/ARCHITECTURE_V2_FINALE.md`

**Contact**: benoit@lagencedescopines.com

---

**Version**: 2.0.0
**Date**: 2025-11-03
**Status**: Production-ready
