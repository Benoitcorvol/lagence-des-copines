# Migration v1 (n8n) vers v2 (FastAPI)

Guide complet pour migrer de l'ancien système n8n vers le nouveau backend v2.

---

## 📊 Comparaison v1 vs v2

### Architecture v1 (n8n workflow)

```
Widget → Webhook n8n → [Workflow séquentiel]
  ├─ Rate limit check
  ├─ Load history
  ├─ Keywords routing (simpliste)
  ├─ Claude API direct (coûteux)
  ├─ RAG placeholder (non implémenté)
  └─ Save messages

Temps: 8-10s
Concurrence: Bloquant
Agent routing: Keywords basiques
RAG: Non implémenté
Coût: Élevé (Anthropic direct)
```

### Architecture v2 (FastAPI)

```
Widget → FastAPI → [Pipeline async optimisé]
  ├─ Rate limit check
  ├─ Load history (parallel)
  ├─ Orchestrator LLM (intelligent)
  ├─ RAG dual agent-specific
  │   ├─ Embeddings (OpenAI)
  │   ├─ Vector search (Supabase)
  │   └─ Rerank (Cohere)
  ├─ OpenRouter (flexible + fallback)
  └─ Save messages (async non-bloquant)

Temps: 3.5-4.5s
Concurrence: Full async
Agent routing: LLM-based (intelligent)
RAG: Complet avec reranker
Coût: Optimisé (OpenRouter)
```

### Bénéfices v2

✅ **60% plus rapide** (3.5s vs 8-10s)
✅ **RAG complet** avec reranker multilingue
✅ **Agents spécialisés** (Audrey + Carole avec personas)
✅ **Orchestration intelligente** (LLM vs keywords)
✅ **Concurrence** (async, multi-users)
✅ **Coût optimisé** (OpenRouter + fallback)
✅ **Monitoring** (analytics par agent)

---

## 🚀 Plan de Migration

### Phase 1: Préparation (1-2 heures)

**Objectif**: Setup backend v2 sans impacter v1

1. **Setup Supabase**
   - Exécuter migrations (ajoute colonnes, pas de breaking change)
   - Tagger documents existants par agent

2. **Deploy backend v2**
   - Sur même VPS que n8n
   - Port différent (8000)
   - URL: `/api/v2/*`

3. **Tests en parallèle**
   - v1 continue sur `/webhook/chat`
   - v2 disponible sur `/api/v2/chat`
   - Aucun impact sur production

### Phase 2: Tests A/B (2-3 jours)

**Objectif**: Valider v2 avec trafic réel

1. **Split traffic**
   - 90% vers v1 (stable)
   - 10% vers v2 (test)

2. **Monitoring**
   - Temps de réponse
   - Taux d'erreur
   - Qualité réponses agents
   - Coûts API

3. **Ajustements**
   - Tuning prompts si nécessaire
   - Optimisation RAG
   - Fix bugs identifiés

### Phase 3: Migration Progressive (1 semaine)

**Objectif**: Basculer progressivement vers v2

1. **Jour 1-2: 50/50 split**
2. **Jour 3-4: 75/25 (v2/v1)**
3. **Jour 5-6: 90/10 (v2/v1)**
4. **Jour 7: 100% v2**

### Phase 4: Cleanup (après 1 semaine stable)

**Objectif**: Retirer v1

1. Désactiver workflow n8n
2. Retirer route `/webhook/chat`
3. Garder n8n pour autres usages (si besoin)
4. Documentation archivée

---

## 🔧 Étapes Détaillées

### Étape 1: Exécuter Migrations Database

**Impact**: ✅ Aucun - Ajoute colonnes, pas de breaking change

```bash
# 1. Backup database (sécurité)
# Dans Supabase Dashboard → Database → Backups

# 2. SQL Editor → New query
# 3. Copier contenu de backend-v2/database/migrations.sql
# 4. Run

# Vérifier succès:
SELECT agent_owner, COUNT(*) FROM documents GROUP BY agent_owner;
# Devrait montrer documents taggés par agent
```

### Étape 2: Deploy Backend v2

**Impact**: ✅ Aucun - Nouveau service indépendant

```bash
# Sur VPS
ssh root@147.79.100.35
cd /opt
git clone <repo> chatbot-v2  # ou scp files
cd chatbot-v2

# Setup
cp .env.example .env
nano .env  # Remplir clés API

# Build et start
docker compose up -d --build

# Vérifier health
curl http://localhost:8000/health
```

### Étape 3: Configurer Nginx pour v2

**Impact**: ✅ Aucun - Ajoute routes, v1 intact

```bash
nano /etc/nginx/sites-available/chat.lagencedescopines.com
```

Ajouter APRÈS les locations existantes:

```nginx
# Backend v2 (nouveau)
location /api/v2/ {
    proxy_pass http://localhost:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Health check v2
location /api/v2/health {
    proxy_pass http://localhost:8000/health;
}
```

Garder location existante pour v1:
```nginx
# V1 (existant - ne pas toucher)
location /webhook/chat {
    proxy_pass http://localhost:5678/webhook/...;
    # ...
}
```

Recharger:
```bash
nginx -t
systemctl reload nginx
```

### Étape 4: Tests Initiaux v2

**Impact**: ✅ Aucun - Tests uniquement

```bash
# Test health
curl https://chat.lagencedescopines.com/api/v2/health

# Test chat (question Audrey - automation)
curl -X POST https://chat.lagencedescopines.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-migration",
    "conversation_id": "test-conv-1",
    "message": "Comment automatiser mes emails de bienvenue?",
    "timestamp": "2025-11-03T12:00:00Z"
  }'

# Devrait retourner réponse d'Audrey (agent: "audrey")

# Test chat (question Carole - création)
curl -X POST https://chat.lagencedescopines.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-migration",
    "conversation_id": "test-conv-2",
    "message": "Aide-moi à créer un reel viral sur Instagram",
    "timestamp": "2025-11-03T12:00:00Z"
  }'

# Devrait retourner réponse de Carole (agent: "carole")
```

Vérifier dans Supabase:
- Table `messages`: Messages sauvegardés avec colonne `agent`
- Table `conversations`: Nouvelles conversations créées

### Étape 5: Modifier Widget pour A/B Test

**Impact**: ⚠️ Partiel - 10% traffic vers v2

Dans `chat-widget/src/services/chatService.ts`:

```typescript
// Configuration A/B split
const USE_V2_PERCENTAGE = 10; // 10% vers v2

function shouldUseV2(): boolean {
  // Hash user_id pour consistance
  const random = Math.random() * 100;
  return random < USE_V2_PERCENTAGE;
}

// API endpoints
const API_V1 = 'https://chat.lagencedescopines.com/webhook/chat';
const API_V2 = 'https://chat.lagencedescopines.com/api/v2/chat';

export async function sendMessage(
  userId: string,
  conversationId: string,
  message: string
): Promise<ChatResponse> {
  const useV2 = shouldUseV2();
  const apiUrl = useV2 ? API_V2 : API_V1;

  // Log pour analytics
  console.log(`Using API ${useV2 ? 'v2' : 'v1'} for user ${userId}`);

  if (useV2) {
    // Format v2
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        message: message,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    return {
      message: data.message,
      agent: data.agent,
      timestamp: data.timestamp,
    };

  } else {
    // Format v1 (existant)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        conversationId,
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    return await response.json();
  }
}
```

Deploy widget:
```bash
cd chat-widget
npm run build
# Deploy vers production
```

### Étape 6: Monitoring A/B Test

**Métriques à suivre** (pendant 2-3 jours):

```sql
-- Dans Supabase SQL Editor

-- 1. Volume par version
SELECT
  CASE
    WHEN agent IS NULL THEN 'v1'
    ELSE 'v2'
  END as version,
  COUNT(*) as message_count,
  COUNT(DISTINCT conversation_id) as conversations
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND role = 'assistant'
GROUP BY version;

-- 2. Performance v2 (temps de réponse)
SELECT
  m1.agent,
  AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))) as avg_seconds,
  COUNT(*) as sample_size
FROM messages m1
JOIN messages m2 ON m1.conversation_id = m2.conversation_id
WHERE m1.role = 'user'
  AND m2.role = 'assistant'
  AND m2.created_at > m1.created_at
  AND m1.created_at > NOW() - INTERVAL '24 hours'
  AND m1.agent IS NOT NULL  -- v2 seulement
GROUP BY m1.agent;

-- 3. Distribution agents v2
SELECT
  agent,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND role = 'assistant'
  AND agent IS NOT NULL
GROUP BY agent;
```

**Logs backend v2**:
```bash
docker logs chatbot-v2 -f --tail 100
```

**KPIs attendus v2**:
- Temps réponse: <5s
- Taux erreur: <1%
- Distribution agents: ~50% Audrey, ~50% Carole, <5% escalate

### Étape 7: Augmenter Traffic v2

Si KPIs OK après 2-3 jours, augmenter progressivement:

```typescript
// Jour 3-4: 50%
const USE_V2_PERCENTAGE = 50;

// Jour 5-6: 75%
const USE_V2_PERCENTAGE = 75;

// Jour 7-8: 90%
const USE_V2_PERCENTAGE = 90;

// Après 1 semaine stable: 100%
const USE_V2_PERCENTAGE = 100;
```

À chaque étape:
1. Deploy widget
2. Monitor 24-48h
3. Vérifier KPIs
4. Si OK → Next step

### Étape 8: Basculement Complet v2

**Quand**: Après 1 semaine à 100% stable

Simplifier widget (retirer A/B):

```typescript
// chat-widget/src/services/chatService.ts
const API_URL = 'https://chat.lagencedescopines.com/api/v2/chat';

export async function sendMessage(
  userId: string,
  conversationId: string,
  message: string
): Promise<ChatResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      conversation_id: conversationId,
      message: message,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Trop de messages. Attendez quelques instants.');
    }
    throw new Error(`Erreur: ${response.status}`);
  }

  return await response.json();
}
```

### Étape 9: Cleanup v1

**Quand**: Après 2 semaines v2 100% stable

```bash
# 1. Désactiver workflow n8n
# Dans n8n UI → Workflow → Toggle "Active" → Inactive

# 2. Retirer route Nginx v1
nano /etc/nginx/sites-available/chat.lagencedescopines.com
# Commenter ou supprimer location /webhook/chat
nginx -t && systemctl reload nginx

# 3. Archiver workflow v1
cd /Users/benoitcorvol/chatbot/chatbot
mkdir -p archive/n8n-v1
mv n8n-workflows archive/n8n-v1/
git add archive/
git commit -m "Archive n8n v1 workflow"
```

Garder n8n running si utilisé pour autres workflows, sinon:
```bash
docker compose stop n8n
```

---

## 📊 Checklist de Migration

### Pré-Migration
- [ ] Backup Supabase database
- [ ] Exécuter migrations SQL
- [ ] Vérifier documents taggés par agent
- [ ] Deploy backend v2 en parallèle
- [ ] Configurer Nginx pour v2
- [ ] Tests manuels v2 (Audrey + Carole)
- [ ] Clés API configurées (OpenRouter, OpenAI, Cohere)

### A/B Test
- [ ] Modifier widget pour split 10/90
- [ ] Deploy widget
- [ ] Monitor logs v2 pendant 24h
- [ ] Vérifier KPIs (temps, erreurs, agents)
- [ ] Ajuster prompts si nécessaire

### Migration Progressive
- [ ] Augmenter à 50% si KPIs OK
- [ ] Monitor 48h
- [ ] Augmenter à 75%
- [ ] Monitor 48h
- [ ] Augmenter à 100%
- [ ] Monitor 1 semaine

### Post-Migration
- [ ] Retirer code A/B du widget
- [ ] Désactiver workflow n8n v1
- [ ] Retirer route Nginx v1
- [ ] Archiver code v1
- [ ] Documentation mise à jour
- [ ] Analytics production stable

---

## 🐛 Rollback Plan

Si problème critique avec v2:

### Rollback Immédiat (urgence)

```typescript
// Dans widget: forcer v1
const USE_V2_PERCENTAGE = 0; // 100% v1
```

Deploy widget → Traffic retourne à v1 immédiatement.

### Rollback Progressif

Si problème mineur:
```typescript
// Réduire progressivement
const USE_V2_PERCENTAGE = 50; // Au lieu de 75%
```

Identifier et corriger problème, puis ré-augmenter.

### Désactiver v2 Complètement

```bash
# Stop backend v2
docker compose stop chatbot-v2

# Retirer route Nginx v2
nano /etc/nginx/sites-available/chat.lagencedescopines.com
# Commenter location /api/v2/
nginx -t && systemctl reload nginx
```

---

## 📞 Support Migration

**Logs v2**: `docker logs chatbot-v2 -f`
**Logs v1**: `docker logs n8n -f`
**Health v2**: `curl https://chat.lagencedescopines.com/api/v2/health`
**Contact**: benoit@lagencedescopines.com

---

**Document**: Migration v1 → v2
**Date**: 2025-11-03
**Status**: Ready for execution
