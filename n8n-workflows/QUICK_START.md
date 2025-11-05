# Guide d'Intégration Rapide - n8n Workflow

Guide visuel pour intégrer le workflow n8n en 10 minutes.

**VPS**: 147.79.100.35
**Domaine**: chat.lagencedescopines.com

---

## 📋 Avant de Commencer

Tu auras besoin de:
- [ ] Accès SSH au VPS (root@147.79.100.35)
- [ ] Clé API Anthropic Claude ([obtenir ici](https://console.anthropic.com/settings/keys))
- [ ] Accès Supabase (tqwmtrhfzaugkrwjcofq)
- [ ] Password Supabase database

---

## 🚀 Étapes d'Intégration

### Étape 1: Accéder à n8n (2 min)

1. **Ouvrir n8n dans ton navigateur**:
   ```
   https://chat.lagencedescopines.com/n8n/
   ```

   Ou si DNS pas encore configuré:
   ```
   http://147.79.100.35:5678/
   ```

2. **Premier accès?**
   - Créer un compte admin
   - Email: benoit@lagencedescopines.com
   - Password: [Choisir un mot de passe fort]
   - Sauvegarder dans 1Password/LastPass

3. **Déjà configuré?**
   - Se connecter avec tes identifiants

---

### Étape 2: Configurer les Credentials (5 min)

#### A. Credential Supabase (PostgreSQL)

1. Dans n8n, cliquer en bas à gauche sur **Settings** ⚙️
2. Aller dans **Credentials**
3. Cliquer **Add Credential** (bouton en haut à droite)
4. Chercher et sélectionner **Postgres**
5. Remplir les informations:

```
Name: Supabase PostgreSQL
Host: db.tqwmtrhfzaugkrwjcofq.supabase.co
Database: postgres
User: postgres
Password: [TON_PASSWORD_SUPABASE]
Port: 5432
SSL Mode: require
```

6. Cliquer **Test** pour vérifier la connexion
7. Si ✅ "Connection successful", cliquer **Save**

**Trouver le password Supabase**:
1. Aller sur https://supabase.com/dashboard
2. Sélectionner projet `tqwmtrhfzaugkrwjcofq`
3. Aller dans **Settings** → **Database**
4. Section "Connection string"
5. Password visible ou regénérable

#### B. Credential Anthropic Claude API

1. Toujours dans **Settings** → **Credentials**
2. Cliquer **Add Credential**
3. Chercher et sélectionner **Anthropic Claude API**
4. Remplir:

```
Name: Anthropic Claude API
API Key: sk-ant-api03-[TA_CLE_ICI]
```

5. Cliquer **Save**

**Obtenir la clé API Anthropic**:
1. Aller sur https://console.anthropic.com/settings/keys
2. Cliquer **Create Key**
3. Nom: "Chatbot L'Agence des Copines"
4. Copier la clé (elle ne sera visible qu'une fois!)

---

### Étape 3: Importer le Workflow (1 min)

1. Dans n8n, cliquer sur **Workflows** (menu de gauche, icône avec 3 carrés)
2. Cliquer **Add Workflow** (bouton en haut)
3. Dans le dropdown qui apparaît, cliquer **Import from File**
4. Sélectionner le fichier:
   ```
   /Users/benoitcorvol/chatbot/chatbot/n8n-workflows/chatbot-message-processing.json
   ```
5. Le workflow s'ouvre automatiquement avec tous les nœuds visibles

**Alternative (si accès SSH)**:
```bash
# Copier le fichier vers le VPS
scp /Users/benoitcorvol/chatbot/chatbot/n8n-workflows/chatbot-message-processing.json \
    root@147.79.100.35:/tmp/

# Puis importer via l'interface n8n
```

---

### Étape 4: Vérifier les Connexions (2 min)

Le workflow a été importé, mais les credentials ne sont pas encore liées.

#### Pour chaque nœud PostgreSQL:

**Nœuds à vérifier** (5 nœuds):
- Rate Limit Check
- Load Conversation History
- Save Conversation
- Save User Message
- Save Bot Message

**Actions**:
1. Cliquer sur le nœud
2. Dans le panneau de droite, section **Credentials**
3. Dropdown: Sélectionner **Supabase PostgreSQL**
4. Fermer le panneau

#### Pour le nœud Claude API:

**Nœud**: Claude API Call

**Actions**:
1. Cliquer sur le nœud
2. Section **Authentication**
3. Dropdown: Vérifier que **Predefined Credential Type** est sélectionné
4. **Credential Type**: Anthropic API
5. **Credential for Anthropic API**: Sélectionner **Anthropic Claude API**
6. Fermer le panneau

---

### Étape 5: Sauvegarder et Activer (1 min)

1. **Sauvegarder le workflow**:
   - En haut à droite, cliquer **Save** (ou Ctrl+S)
   - Nom suggéré: "Chatbot L'Agence des Copines - Message Processing"

2. **Activer le workflow**:
   - En haut à droite, toggle **Inactive** → **Active**
   - Le toggle devient vert ✅
   - Le workflow est maintenant en écoute!

3. **Noter l'URL du webhook**:
   - Cliquer sur le nœud **Webhook Trigger** (premier nœud)
   - Dans le panneau de droite, copier **Production URL**
   - Format: `https://chat.lagencedescopines.com/webhook-test/[ID]/chat`
   - Noter le **[ID]** pour l'étape suivante

---

### Étape 6: Configurer Nginx (2 min)

Le webhook n8n a une URL compliquée avec ID. On va créer une URL simple.

**Sur ton Mac** (ou SSH au VPS):

```bash
# Se connecter au VPS
ssh root@147.79.100.35

# Éditer la config Nginx
nano /etc/nginx/sites-available/chat.lagencedescopines.com
```

**Ajouter cette section** (remplacer `[WORKFLOW-ID]` par l'ID copié à l'étape 5):

```nginx
# Webhook pour chatbot
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

    # Timeouts
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

**Sauvegarder et recharger**:

```bash
# Sauvegarder: Ctrl+O, Enter, Ctrl+X

# Tester la config
nginx -t

# Si OK, recharger Nginx
systemctl reload nginx
```

---

### Étape 7: Tester le Workflow (2 min)

**Test 1: Simple sanity check**

```bash
curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "conversationId": "test-conv-1",
    "message": "Bonjour, comment créer du contenu Instagram?",
    "timestamp": "2025-11-03T12:00:00.000Z"
  }'
```

**Attendu**: JSON response avec:
```json
{
  "response": "Pour créer du contenu engageant sur Instagram...",
  "agentType": "creation",
  "conversationId": "test-conv-1",
  "timestamp": "2025-11-03T12:00:05.000Z",
  "loopDetected": false
}
```

**Test 2: Vérifier dans n8n**

1. Dans n8n, cliquer sur **Executions** (menu de gauche)
2. Tu devrais voir une exécution récente
3. Cliquer dessus pour voir le détail
4. Tous les nœuds doivent être verts ✅

**Test 3: Vérifier dans Supabase**

1. Aller sur https://supabase.com/dashboard/project/tqwmtrhfzaugkrwjcofq
2. **Table Editor** → Table `conversations`
3. Tu devrais voir la conversation `test-conv-1`
4. **Table Editor** → Table `messages`
5. Tu devrais voir 2 messages (user + assistant)

---

## 🎉 C'est Fait!

Le workflow est maintenant **actif et fonctionnel**!

### URL de Production

```
https://chat.lagencedescopines.com/webhook/chat
```

### Prochaines Étapes

1. **Mettre à jour le widget**:
   ```bash
   cd /Users/benoitcorvol/chatbot/chatbot/chat-widget/src
   nano widget.js

   # Ligne CONFIG.API_URL:
   API_URL: 'https://chat.lagencedescopines.com/webhook/chat',

   # Rebuild
   cd ..
   ./build.sh
   ```

2. **Déployer le widget sur VPS**:
   ```bash
   scp dist/widget.min.js root@147.79.100.35:/var/www/chat-widget/dist/
   ```

3. **Tester end-to-end**:
   ```bash
   # Ouvrir la page de test
   cd /Users/benoitcorvol/chatbot/chatbot/chat-widget
   open test/demo.html
   ```

---

## 🚧 En Cas de Problème

### Problème 1: "Connection failed" pour Supabase

**Solution**:
1. Vérifier le password Supabase
2. Tester manuellement:
   ```bash
   psql -h db.tqwmtrhfzaugkrwjcofq.supabase.co -U postgres -d postgres
   # Entrer le password
   ```
3. Si ça fonctionne, refaire l'étape 2A

### Problème 2: "Unauthorized" pour Claude API

**Solution**:
1. Vérifier que la clé API commence par `sk-ant-api03-`
2. Tester la clé:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: TA_CLE_ICI" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
   ```
3. Si erreur, régénérer la clé sur console.anthropic.com

### Problème 3: Workflow ne s'active pas

**Solution**:
1. Vérifier que tous les credentials sont configurées (étape 4)
2. Sauvegarder le workflow (Ctrl+S)
3. Réessayer d'activer
4. Si toujours bloqué, voir les logs:
   ```bash
   ssh root@147.79.100.35
   docker compose logs -f n8n | tail -50
   ```

### Problème 4: 502 Bad Gateway sur webhook

**Solution**:
1. Vérifier que n8n est running:
   ```bash
   ssh root@147.79.100.35
   docker compose ps n8n
   ```
2. Si pas running:
   ```bash
   docker compose up -d n8n
   ```
3. Vérifier l'ID du workflow dans nginx config (étape 6)

---

## 📊 Monitoring

### Voir les Logs n8n

```bash
ssh root@147.79.100.35

# Logs en temps réel
docker compose logs -f n8n

# Derniers logs
docker compose logs --tail=100 n8n

# Rechercher erreurs
docker compose logs n8n | grep ERROR
```

### Voir les Exécutions

1. Dans n8n UI: **Executions** (menu de gauche)
2. Liste de toutes les exécutions
3. Cliquer sur une pour voir détails
4. Chaque nœud montre input/output

### Métriques Supabase

```sql
-- Nombre de messages traités aujourd'hui
SELECT COUNT(*) FROM messages
WHERE DATE(created_at) = CURRENT_DATE;

-- Répartition agents
SELECT agent_type, COUNT(*) as count
FROM messages
WHERE role = 'assistant'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY agent_type;
```

---

## 📞 Support

**Documentation Complète**:
- `README.md` - Architecture et tests détaillés
- `DEPLOYMENT.md` - Guide de déploiement complet
- `IMPLEMENTATION_SUMMARY.md` - Détails techniques

**En cas de blocage**:
1. Vérifier les logs n8n
2. Vérifier les executions dans n8n UI
3. Tester les credentials manuellement
4. Consulter DEPLOYMENT.md section "Dépannage"

---

**Bonne chance! 🚀**

Le workflow est prêt à traiter les messages du chatbot. Une fois activé, il répondra automatiquement aux requêtes du widget avec l'agent approprié (Création ou Automation).
