# ✅ TODO - Actions Requises

Liste des actions à effectuer pour mettre en production le backend v2.

---

## 🔑 1. Obtenir les Clés API (30 minutes)

### OpenRouter (Obligatoire)

1. Aller sur https://openrouter.ai
2. Sign up avec email ou GitHub
3. Dashboard → API Keys → Create New Key
4. Copier la clé: `sk-or-v1-xxx...`
5. **Ajouter des crédits**: Settings → Billing → Add Credits ($10-20 pour commencer)

**Pourquoi**: Accès aux modèles Claude et GPT avec fallback automatique

---

### OpenAI (Obligatoire)

1. Aller sur https://platform.openai.com
2. Sign up / Login
3. API Keys → Create new secret key
4. Copier la clé: `sk-xxx...`
5. **Ajouter des crédits**: Billing → Add payment method

**Pourquoi**: Génération d'embeddings pour RAG (text-embedding-3-small)

---

### Cohere (Obligatoire)

1. Aller sur https://cohere.com
2. Sign up avec email
3. Dashboard → API Keys
4. Copier la clé (format alphanumeric)
5. Free tier disponible (10K requests/mois)

**Pourquoi**: Reranking multilingue des résultats RAG (rerank-multilingual-v3.0)

---

### Supabase (Déjà existant)

1. Aller sur https://supabase.com/dashboard/project/tqwmtrhfzaugkrwjcofq
2. Settings → API
3. Copier:
   - Project URL: `https://tqwmtrhfzaugkrwjcofq.supabase.co`
   - Service role key (anon key ne suffit PAS)

**Pourquoi**: Base de données PostgreSQL + pgvector

---

## 🗄️ 2. Exécuter Migrations Database (10 minutes)

### Dans Supabase Dashboard

1. Aller sur https://supabase.com/dashboard/project/tqwmtrhfzaugkrwjcofq
2. Cliquer sur "SQL Editor" dans le menu gauche
3. New Query
4. Ouvrir le fichier `/Users/benoitcorvol/chatbot/chatbot/backend-v2/database/migrations.sql`
5. Copier TOUT le contenu
6. Coller dans l'éditeur SQL
7. Cliquer "Run"
8. Vérifier "Success" en bas

### Vérification

Exécuter cette requête pour vérifier:

```sql
-- Check colonnes ajoutées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('agent_owner', 'tags', 'category', 'priority');

-- Check fonctions créées
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'match_documents_audrey',
  'match_documents_carole',
  'check_rate_limit',
  'tag_documents_by_keywords'
);

-- Check documents taggés
SELECT agent_owner, COUNT(*) as count
FROM documents
GROUP BY agent_owner;
```

**Résultat attendu**:
- 4 colonnes retournées pour documents
- 4 fonctions retournées
- Documents répartis entre 'audrey', 'carole', 'shared'

**⚠️ Si des documents ne sont pas taggés** (agent_owner = NULL):

Exécuter manuellement le tagging:
```sql
-- Tag documents Audrey (automation, funnels, email)
SELECT tag_documents_by_keywords(
  'audrey',
  ARRAY['%tunnel%', '%funnel%', '%email%', '%automation%', '%kajabi%', '%zapier%']
);

-- Tag documents Carole (Instagram, création)
SELECT tag_documents_by_keywords(
  'carole',
  ARRAY['%instagram%', '%reel%', '%story%', '%contenu%', '%création%', '%design%']
);

-- Le reste en shared
UPDATE documents SET agent_owner = 'shared' WHERE agent_owner IS NULL;
```

---

## 💻 3. Choisir et Exécuter Déploiement

### Option A: VPS Docker (Recommandé si tu as déjà le VPS)

**Temps**: 1-2 heures

**Étapes**:
1. Lire `DEPLOYMENT.md` → Section "Option 1: VPS Docker"
2. SSH au VPS: `ssh root@147.79.100.35`
3. Créer dossier: `mkdir -p /opt/chatbot-v2`
4. Upload files depuis local: `scp -r backend-v2/* root@147.79.100.35:/opt/chatbot-v2/`
5. Créer `.env` avec tes clés API
6. `docker compose up -d --build`
7. Configurer Nginx reverse proxy
8. Test: `curl https://chat.lagencedescopines.com/health`

**Avantages**: Contrôle total, pas de coût supplémentaire

---

### Option B: Serverless (Railway/Render)

**Temps**: 30 minutes - 1 heure

**Étapes**:
1. Lire `DEPLOYMENT.md` → Section "Option 2: Serverless"
2. Créer compte sur https://railway.app (ou Render, Fly.io)
3. Connect GitHub repo
4. Configurer variables d'environnement (toutes les clés API)
5. Deploy automatique
6. Obtenir URL: `https://ton-app.railway.app`
7. (Optionnel) Custom domain

**Avantages**: Zéro gestion serveur, scaling auto

**Inconvénient**: Coût mensuel (~$5-10)

---

### Option C: Cohabitation avec n8n (Migration Progressive)

**Temps**: 2-3 heures setup + 1 semaine migration

**Étapes**:
1. Lire `DEPLOYMENT.md` → Section "Option 3: Cohabitation"
2. Lire `MIGRATION_V1_TO_V2.md` complet
3. Deploy v2 sur VPS (même serveur que n8n)
4. Configurer Nginx pour `/api/v2/*` → backend v2
5. Modifier widget pour A/B split (10% v2, 90% v1)
6. Monitor 2-3 jours
7. Augmenter progressivement (50% → 75% → 100%)
8. Après 1 semaine stable, désactiver v1

**Avantages**: Migration sans risque, rollback facile

**Recommandé si**: Tu as déjà v1 en prod

---

## 🧪 4. Tests Avant Production (20 minutes)

### Si déploiement local/VPS

```bash
# 1. Health check
curl https://chat.lagencedescopines.com/health
# Expected: {"status":"healthy","services":{...}}

# 2. Test Audrey (automation expert)
curl -X POST https://chat.lagencedescopines.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "conversation_id": "test-conv-1",
    "message": "Comment automatiser mes emails de bienvenue avec Kajabi?",
    "timestamp": "2025-11-03T14:00:00Z"
  }'
# Expected: "agent": "audrey", réponse sur automation

# 3. Test Carole (création expert)
curl -X POST https://chat.lagencedescopines.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "conversation_id": "test-conv-2",
    "message": "Aide-moi à créer un reel Instagram qui engage ma communauté",
    "timestamp": "2025-11-03T14:00:00Z"
  }'
# Expected: "agent": "carole", réponse créative avec emojis

# 4. Test rate limit
curl https://chat.lagencedescopines.com/api/v2/rate-limit/test-conv-1
# Expected: {"allowed":true,"remaining":8,...}
```

### Vérifier dans Supabase

1. Table `messages`: Nouveaux messages visibles
2. Colonne `agent`: 'audrey' ou 'carole' remplie
3. Table `conversations`: Nouvelles entrées

---

## 🔌 5. Intégrer avec le Widget (1 heure)

### Modifier `chat-widget/src/services/chatService.ts`

**Si migration progressive (A/B test)**:

Voir code dans `MIGRATION_V1_TO_V2.md` → Étape 5

**Si basculement direct**:

```typescript
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://chat.lagencedescopines.com/api/v2/chat'
  : 'http://localhost:8000/api/chat';

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
      throw new Error('Trop de messages. Veuillez patienter.');
    }
    throw new Error(`Erreur: ${response.status}`);
  }

  return await response.json();
}
```

### (Optionnel) Afficher indicateur agent

Montrer visuellement quel agent répond:

```tsx
// Dans message assistant
{!isUser && message.agent && (
  <div className="agent-badge">
    {message.agent === 'audrey' ? '👩‍💼 Audrey' : '🎨 Carole'}
  </div>
)}
```

### Deploy widget

```bash
cd chat-widget
npm run build
# Deploy build/ vers hosting
```

---

## 📊 6. Monitoring Post-Déploiement (Ongoing)

### Logs Backend

```bash
# Docker
docker logs chatbot-v2 -f --tail 100

# Chercher erreurs
docker logs chatbot-v2 2>&1 | grep ERROR
docker logs chatbot-v2 2>&1 | grep WARNING
```

### Analytics Supabase

Requêtes SQL utiles (exécuter dans SQL Editor):

```sql
-- Messages par agent (24h)
SELECT
  agent,
  COUNT(*) as messages,
  COUNT(DISTINCT conversation_id) as conversations
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND role = 'assistant'
GROUP BY agent;

-- Temps de réponse moyen
SELECT
  m1.agent,
  AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))) as avg_seconds
FROM messages m1
JOIN messages m2 ON m1.conversation_id = m2.conversation_id
WHERE m1.role = 'user'
  AND m2.role = 'assistant'
  AND m2.created_at > m1.created_at
  AND m1.created_at > NOW() - INTERVAL '24 hours'
GROUP BY m1.agent;

-- Rate limit hits
SELECT
  conversation_id,
  COUNT(*) as messages_in_minute
FROM messages
WHERE created_at > NOW() - INTERVAL '1 minute'
GROUP BY conversation_id
HAVING COUNT(*) > 10;
```

### Métriques à surveiller

**Quotidien** (premiers jours):
- ✅ Pas d'erreurs 500 dans logs
- ✅ Temps réponse <5s
- ✅ Distribution agents ~50/50 Audrey/Carole
- ✅ <5% escalations

**Hebdomadaire** (après stabilisation):
- Volume conversations
- Messages par agent
- Taux erreur
- Coûts API

---

## 💰 7. Gérer les Coûts API

### Monitoring OpenRouter

1. Dashboard: https://openrouter.ai/dashboard
2. Voir usage par modèle
3. Set spending limits si disponible

### Monitoring OpenAI

1. Dashboard: https://platform.openai.com/usage
2. Voir coût embeddings
3. Set usage limits: Settings → Limits

### Monitoring Cohere

1. Dashboard: https://dashboard.cohere.com
2. Track reranking calls
3. Free tier: 10K calls/mois

### Coûts Estimés

**Pour ~1000 conversations/mois** (~5000 messages):

| Service | Usage | Coût/mois |
|---------|-------|-----------|
| OpenRouter (Claude Haiku orchestrator) | ~5K calls | ~$5 |
| OpenRouter (Claude Sonnet agents) | ~5K calls | ~$20 |
| OpenAI (embeddings) | ~5K embeddings | ~$5 |
| Cohere (reranking) | ~5K reranks | ~$5 |
| **TOTAL** | | **~$35/mois** |

**vs v1 Anthropic direct**: ~$80-100/mois
**Économie**: 50-60% 💰

---

## 📋 Checklist Complète

### Préparation
- [ ] Obtenu clé OpenRouter + ajouté crédits
- [ ] Obtenu clé OpenAI + ajouté crédits
- [ ] Obtenu clé Cohere (free tier OK)
- [ ] Vérifié accès Supabase service key

### Database
- [ ] Exécuté `database/migrations.sql` dans Supabase
- [ ] Vérifié colonnes `agent_owner`, `tags`, `category` existent
- [ ] Vérifié fonctions `match_documents_audrey/carole` créées
- [ ] Vérifié documents taggés par agent (pas de NULL)

### Déploiement
- [ ] Choisi option déploiement (VPS/Serverless/Hybrid)
- [ ] Créé fichier `.env` avec toutes les clés
- [ ] Déployé backend v2
- [ ] Testé health endpoint
- [ ] Testé chat endpoint (Audrey + Carole)
- [ ] Vérifié messages sauvegardés dans Supabase

### Widget
- [ ] Modifié `chatService.ts` pour appeler v2
- [ ] (Optionnel) Ajouté indicateur agent
- [ ] Testé en local
- [ ] Déployé en production

### Post-Déploiement
- [ ] Monitoring logs actif
- [ ] Analytics Supabase configurées
- [ ] Métriques initiales enregistrées
- [ ] Plan de suivi hebdomadaire défini

### Si Migration v1→v2
- [ ] A/B split configuré (10% v2)
- [ ] Monitoring comparatif v1/v2
- [ ] Plan augmentation progressive défini
- [ ] Rollback plan documenté

---

## 🆘 En Cas de Problème

### Impossible d'obtenir clé API

**OpenRouter**: Accepte cartes internationales, PayPal
**OpenAI**: Nécessite carte valide, peut utiliser carte virtuelle
**Cohere**: Free tier sans carte requise

### Migrations SQL échouent

1. Vérifier tables `documents`, `messages`, `document_chunks` existent
2. Vérifier extension pgvector activée: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Exécuter migrations une à une pour identifier ligne problématique

### Backend ne démarre pas

```bash
# Check logs
docker logs chatbot-v2

# Issues communes:
# - .env manquant → Créer .env avec toutes variables
# - Port 8000 utilisé → docker ps | grep 8000
# - Import errors → docker compose up -d --build
```

### Agents ne répondent pas correctement

1. Vérifier RAG retourne résultats: Logs montrent "Retrieved X chunks"
2. Si 0 chunks → Documents pas taggés ou pas d'embeddings
3. Ajuster prompts dans `services/openrouter_client.py` si nécessaire

### Rate limit trop restrictif

Modifier dans `.env`:
```env
RATE_LIMIT_MESSAGES=20      # Au lieu de 10
RATE_LIMIT_WINDOW_SECONDS=120  # Au lieu de 60
```

Redémarrer: `docker compose restart chatbot-v2`

---

## 📞 Support

**Documentation**:
- Installation: `README.md`
- Déploiement: `DEPLOYMENT.md`
- Migration: `MIGRATION_V1_TO_V2.md`
- Architecture: `/n8n-workflows-v2/ARCHITECTURE_V2_FINALE.md`

**Contact**: benoit@lagencedescopines.com

---

## ⏱️ Temps Total Estimé

- Obtenir clés API: **30 min**
- Migrations database: **10 min**
- Déploiement (VPS): **1-2h**
- Tests: **20 min**
- Intégration widget: **1h**
- **TOTAL**: **3-4 heures**

Si migration progressive v1→v2: Ajouter **1 semaine** de monitoring

---

**Prêt à commencer?** 🚀

Commence par obtenir les clés API, puis exécute les migrations database!

---

**Document**: TODO User Actions
**Date**: 2025-11-03
**Status**: Ready to execute
