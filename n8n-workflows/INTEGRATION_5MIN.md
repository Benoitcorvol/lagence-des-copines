# Intégration n8n en 5 Minutes ⚡

Guide ultra-rapide pour les gens pressés.

---

## ✅ Prérequis

Tu as besoin de:
- Clé API Anthropic: https://console.anthropic.com/settings/keys
- Password Supabase: https://supabase.com/dashboard → Settings → Database

---

## 🚀 5 Étapes Rapides

### 1️⃣ Ouvrir n8n (30 sec)

```
https://chat.lagencedescopines.com/n8n/
```

Se connecter ou créer compte

---

### 2️⃣ Ajouter Credentials (2 min)

**Supabase** (Settings → Credentials → Add → Postgres):
```
Name: Supabase PostgreSQL
Host: db.tqwmtrhfzaugkrwjcofq.supabase.co
Database: postgres
User: postgres
Password: [TON_PASSWORD]
Port: 5432
SSL: require
```
Test → Save

**Claude** (Settings → Credentials → Add → Anthropic):
```
Name: Anthropic Claude API
API Key: sk-ant-api03-[TA_CLE]
```
Save

---

### 3️⃣ Importer Workflow (1 min)

Workflows → Add → **Import from File**

Fichier: `/Users/benoitcorvol/chatbot/chatbot/n8n-workflows/chatbot-message-processing.json`

---

### 4️⃣ Lier Credentials (1 min)

**5 nœuds PostgreSQL** (Rate Limit Check, Load History, Save × 3):
- Cliquer sur chaque nœud
- Credentials → Sélectionner "Supabase PostgreSQL"

**1 nœud Claude** (Claude API Call):
- Cliquer sur le nœud
- Credential → Sélectionner "Anthropic Claude API"

---

### 5️⃣ Activer (30 sec)

- **Save** (en haut à droite)
- Toggle **Inactive** → **Active**

---

## ✅ Tester (1 min)

```bash
curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "conversationId": "test",
    "message": "Hello!",
    "timestamp": "2025-11-03T12:00:00Z"
  }'
```

Attendu: JSON avec `response`, `agentType`, etc.

---

## 🎉 C'est Fait!

Le workflow est actif et répond aux messages du widget.

**Webhook URL**: `https://chat.lagencedescopines.com/webhook/chat`

**Voir exécutions**: n8n → Executions (menu gauche)

---

## 🆘 Problème?

**"Connection failed" Supabase**: Vérifier password
**"Unauthorized" Claude**: Vérifier clé API commence par `sk-ant-`
**Workflow ne s'active pas**: Vérifier toutes credentials liées

**Logs**:
```bash
ssh root@147.79.100.35
docker compose logs -f n8n
```

---

**Documentation complète**: Voir `QUICK_START.md` ou `INTEGRATION_VISUELLE.md`
