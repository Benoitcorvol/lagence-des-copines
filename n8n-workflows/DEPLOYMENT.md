# Guide de Déploiement - n8n Workflows

Guide complet pour déployer les workflows n8n sur le VPS Hostinger.

**VPS**: 147.79.100.35
**Domaine**: chat.lagencedescopines.com
**Date**: 2025-11-03

---

## 📋 Prérequis

Vérifier que ces éléments sont en place:

- [x] VPS Hostinger configuré (Epic 1.1)
- [x] n8n + Redis running via Docker (Epic 1.3)
- [x] Nginx reverse proxy configuré (Epic 1.4)
- [x] Supabase database avec schema (Epic 1.5)
- [x] Widget build et prêt (Epic 2)

---

## 🚀 Déploiement Étape par Étape

### Étape 1: Connexion au VPS

```bash
ssh root@147.79.100.35
```

### Étape 2: Vérifier que n8n est running

```bash
cd /opt/docker
docker compose ps
```

**Attendu**:
```
NAME                COMMAND                  SERVICE             STATUS
n8n                 "tini -- /docker-ent…"   n8n                 Up
redis               "docker-entrypoint.s…"   redis               Up
```

Si n8n n'est pas running:
```bash
docker compose up -d n8n redis
```

### Étape 3: Accéder à n8n

Ouvrir dans le navigateur:
```
https://chat.lagencedescopines.com/n8n/
```

Ou si DNS pas encore configuré:
```
http://147.79.100.35:5678/
```

**Premier accès**: Créer compte admin n8n
- Email: benoit@lagencedescopines.com
- Password: [Générer mot de passe fort]
- Save credentials dans 1Password/LastPass

### Étape 4: Configuration des Credentials

#### A. PostgreSQL (Supabase)

1. Aller dans **Settings** → **Credentials**
2. Cliquer **Add Credential**
3. Chercher et sélectionner **Postgres**
4. Remplir:
   ```
   Name: Supabase PostgreSQL
   Host: db.tqwmtrhfzaugkrwjcofq.supabase.co
   Database: postgres
   User: postgres
   Password: [SUPABASE_DB_PASSWORD]
   Port: 5432
   SSL Mode: require
   ```
5. Tester la connexion: **Test**
6. Sauvegarder: **Save**

#### B. Anthropic Claude API

1. **Settings** → **Credentials** → **Add Credential**
2. Chercher et sélectionner **Anthropic Claude API**
3. Remplir:
   ```
   Name: Anthropic Claude API
   API Key: sk-ant-api03-[YOUR_KEY]
   ```
4. Tester avec curl:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Test"}]}'
   ```
5. Sauvegarder: **Save**

### Étape 5: Importer le Workflow

1. Dans n8n, cliquer **Workflows** (menu de gauche)
2. Cliquer **Add Workflow** → **Import from File**
3. Uploader `chatbot-message-processing.json` depuis:
   ```
   /Users/benoitcorvol/chatbot/chatbot/n8n-workflows/chatbot-message-processing.json
   ```
4. Le workflow s'ouvre automatiquement

### Étape 6: Vérifier les Connexions

Pour chaque nœud qui utilise des credentials:

#### PostgreSQL nodes (Rate Limit Check, Load History, Save nodes)
1. Cliquer sur le nœud
2. Dans **Credentials**, sélectionner **Supabase PostgreSQL**
3. Si pas disponible, créer selon Étape 4.A

#### HTTP Request node (Claude API Call)
1. Cliquer sur le nœud
2. Dans **Authentication**, sélectionner **Predefined Credential Type**
3. **Credential Type**: Anthropic API
4. **Credential**: Sélectionner **Anthropic Claude API**
5. Si pas disponible, créer selon Étape 4.B

### Étape 7: Configurer le Webhook

1. Cliquer sur le nœud **Webhook Trigger**
2. Noter l'URL du webhook (format: `https://chat.lagencedescopines.com/webhook-test/[workflow-id]/chat`)
3. Copier le **Workflow ID** (dans l'URL du workflow en haut du navigateur)

### Étape 8: Activer le Workflow

1. En haut à droite, toggle **Inactive** → **Active**
2. Le workflow est maintenant en écoute

**URL du webhook**:
```
https://chat.lagencedescopines.com/webhook/chat
```

### Étape 9: Configurer Nginx pour le Webhook

Sur le VPS:

```bash
# Éditer la config Nginx
nano /etc/nginx/sites-available/chat.lagencedescopines.com

# Ajouter location pour webhook
location /webhook/chat {
    proxy_pass http://localhost:5678/webhook-test/[WORKFLOW-ID]/chat;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # CORS headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'POST, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Content-Type' always;

    # Timeout
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}

# Tester la config
nginx -t

# Recharger Nginx
systemctl reload nginx
```

**Remplacer `[WORKFLOW-ID]`** par l'ID réel du workflow (visible dans l'URL n8n).

### Étape 10: Tester le Déploiement

#### Test 1: Sanity check

```bash
curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "conversationId": "test-conv",
    "message": "Hello, test message!",
    "timestamp": "2025-11-03T12:00:00.000Z"
  }'
```

**Attendu**: Réponse JSON avec `response`, `agentType`, `conversationId`, `timestamp`

#### Test 2: Agent Création

```bash
curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "conversationId": "test-conv-creation",
    "message": "Comment créer du contenu engageant sur Instagram?",
    "timestamp": "2025-11-03T12:01:00.000Z"
  }'
```

**Attendu**: Réponse avec `agentType: "creation"`

#### Test 3: Agent Automation

```bash
curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "conversationId": "test-conv-automation",
    "message": "Comment créer un tunnel de vente automatisé?",
    "timestamp": "2025-11-03T12:02:00.000Z"
  }'
```

**Attendu**: Réponse avec `agentType: "automation"`

#### Test 4: Vérifier dans Supabase

1. Ouvrir Supabase: https://supabase.com/dashboard/project/tqwmtrhfzaugkrwjcofq
2. Aller dans **Table Editor**
3. Table `conversations`:
   ```sql
   SELECT * FROM conversations WHERE user_id = 'test-user';
   ```
4. Table `messages`:
   ```sql
   SELECT * FROM messages WHERE conversation_id LIKE 'test-conv%' ORDER BY timestamp DESC;
   ```

**Attendu**: Messages user et assistant visibles

### Étape 11: Configurer les Variables d'Environnement

Sur le VPS:

```bash
cd /opt/docker

# Éditer .env
nano .env

# Ajouter:
RATE_LIMIT_PER_MINUTE=10
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=1000
CLAUDE_TEMPERATURE=0.7

# Redémarrer n8n pour appliquer
docker compose restart n8n
```

### Étape 12: Mettre à Jour le Widget

Éditer le widget pour pointer vers le webhook de production:

```bash
cd /Users/benoitcorvol/chatbot/chatbot/chat-widget/src
nano widget.js

# Ligne CONFIG.API_URL, remplacer par:
API_URL: 'https://chat.lagencedescopines.com/webhook/chat',

# Rebuild
cd ..
./build.sh
```

---

## 🔍 Vérification Post-Déploiement

### Checklist

- [ ] n8n accessible via https://chat.lagencedescopines.com/n8n/
- [ ] Workflow actif et en écoute
- [ ] Webhook accessible via https://chat.lagencedescopines.com/webhook/chat
- [ ] Credentials Supabase configurées et testées
- [ ] Credentials Claude API configurées et testées
- [ ] Test curl réussit avec réponse 200
- [ ] Messages sauvegardés dans Supabase
- [ ] Historique conversation fonctionne
- [ ] Agent routing fonctionne (création/automation)
- [ ] Rate limiting fonctionne (>10 messages → 429)
- [ ] Widget pointé vers webhook production

### Monitoring

#### Logs n8n
```bash
# Voir logs en temps réel
docker compose logs -f n8n

# Voir logs récents
docker compose logs --tail=100 n8n

# Rechercher erreurs
docker compose logs n8n | grep ERROR
```

#### Logs Nginx
```bash
# Access logs
tail -f /var/log/nginx/access.log | grep webhook

# Error logs
tail -f /var/log/nginx/error.log
```

#### Métriques Supabase
```sql
-- Messages traités aujourd'hui
SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURRENT_DATE;

-- Répartition agents
SELECT agent_type, COUNT(*) as count
FROM messages
WHERE role = 'assistant' AND DATE(created_at) = CURRENT_DATE
GROUP BY agent_type;

-- Taux d'erreur (si tracking erreurs)
SELECT
  COUNT(CASE WHEN status = 'error' THEN 1 END)::float / COUNT(*) * 100 as error_rate
FROM conversations
WHERE DATE(last_message_at) = CURRENT_DATE;
```

---

## 🚧 Dépannage

### Problème: Workflow ne démarre pas

**Symptômes**: Toggle reste sur "Inactive"

**Solutions**:
1. Vérifier credentials configurées
2. Vérifier webhook trigger configuré
3. Voir logs n8n pour erreurs:
   ```bash
   docker compose logs n8n | tail -50
   ```

### Problème: 502 Bad Gateway sur webhook

**Symptômes**: curl retourne 502

**Solutions**:
1. Vérifier n8n running:
   ```bash
   docker compose ps n8n
   ```
2. Vérifier webhook ID correct dans nginx config
3. Tester directement port 5678:
   ```bash
   curl http://localhost:5678/webhook-test/[ID]/chat
   ```

### Problème: 401 Unauthorized de Claude API

**Symptômes**: Erreur "Invalid API key" dans logs

**Solutions**:
1. Vérifier `ANTHROPIC_API_KEY` dans credentials
2. Tester clé directement:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: sk-ant-..." \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
   ```
3. Régénérer clé si nécessaire: https://console.anthropic.com/settings/keys

### Problème: Messages pas sauvegardés dans Supabase

**Symptômes**: Query retourne 0 rows

**Solutions**:
1. Vérifier credentials PostgreSQL
2. Tester connexion manuellement:
   ```bash
   psql -h db.tqwmtrhfzaugkrwjcofq.supabase.co -U postgres -d postgres
   ```
3. Vérifier schema existe:
   ```sql
   \dt
   SELECT * FROM conversations LIMIT 1;
   SELECT * FROM messages LIMIT 1;
   ```
4. Vérifier nœuds Save ont credentials configurées

### Problème: Rate limiting trop strict/laxiste

**Symptômes**: Users bloqués trop vite ou pas du tout

**Solutions**:
1. Vérifier variable `RATE_LIMIT_PER_MINUTE`
2. Modifier dans workflow (nœud "Check Rate Limit"):
   ```javascript
   const rateLimit = parseInt($env.RATE_LIMIT_PER_MINUTE || 10);
   ```
3. Sauvegarder et tester

---

## 📊 Performance Monitoring

### Temps de Réponse

Monitorer avec:
```bash
# Test avec mesure temps
time curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Objectif**: <8 secondes

### Métriques n8n

Dans n8n UI:
1. Aller dans **Executions**
2. Voir temps d'exécution de chaque workflow
3. Identifier bottlenecks (généralement Claude API call: 3-6s)

### Database Performance

```sql
-- Index sur timestamps (si pas déjà créé)
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Vérifier performance queries
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE conversation_id = 'test' AND timestamp > NOW() - INTERVAL '1 minute';
```

---

## 🔐 Sécurité Post-Déploiement

### Restreindre CORS en Production

Une fois Kajabi configuré, restreindre CORS:

```nginx
# Dans /etc/nginx/sites-available/chat.lagencedescopines.com
location /webhook/chat {
    # Remplacer * par domaine spécifique
    add_header Access-Control-Allow-Origin https://lagencedescopines.kajabi.com always;
}
```

### Rotation des Clés API

Planifier rotation tous les 90 jours:
- [ ] Anthropic API key
- [ ] Supabase service key
- [ ] n8n encryption key

### Firewall

Vérifier que seuls ports nécessaires sont ouverts:
```bash
ufw status

# Attendu:
# 22 (SSH), 80 (HTTP), 443 (HTTPS), 5678 (n8n - localhost only)
```

### SSL Certificate

Vérifier auto-renewal Certbot:
```bash
certbot renew --dry-run
```

---

## 📝 Checklist Finale

Avant de marquer Epic 3 comme "DONE":

- [ ] Workflow importé et actif
- [ ] Toutes credentials configurées
- [ ] Webhook accessible et teste OK
- [ ] Agent routing testé (création + automation)
- [ ] Rate limiting testé (10+ messages → 429)
- [ ] Historique conversation testé
- [ ] Loop detection testé (7+ messages)
- [ ] Messages sauvegardés dans Supabase
- [ ] Widget mis à jour avec webhook URL
- [ ] Nginx config updated avec webhook location
- [ ] Logs monitoring configuré
- [ ] Documentation complète
- [ ] Tests E2E passent
- [ ] Performance <8s validée

---

## 🎉 Go-Live

Une fois tous les tests passés:

1. **Annoncer le déploiement**
   - Notifier l'équipe L'Agence des Copines
   - Status page updated (si applicable)

2. **Monitorer pendant 24h**
   - Logs n8n
   - Logs Nginx
   - Métriques Supabase
   - Temps de réponse

3. **Collecter feedback initial**
   - Premiers utilisateurs test
   - Ajustements prompts si nécessaire

4. **Planifier Epic 4**
   - RAG Knowledge Base
   - Document ingestion pipeline

---

**Déploiement préparé par**: Claude Code
**Date**: 2025-11-03
**Epic**: 3/4 (n8n AI Orchestration Backend)
**Status**: READY FOR DEPLOYMENT ✅
