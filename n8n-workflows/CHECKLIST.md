# Checklist Intégration n8n ✓

À imprimer ou garder ouvert pendant l'intégration.

---

## 📋 Avant de Commencer

- [ ] Clé API Anthropic obtenue (https://console.anthropic.com/settings/keys)
- [ ] Password Supabase noté (https://supabase.com/dashboard)
- [ ] Accès n8n confirmé (https://chat.lagencedescopines.com/n8n/)
- [ ] Fichier workflow disponible (`chatbot-message-processing.json`)

---

## 🔐 Configuration Credentials

### Supabase PostgreSQL

- [ ] Settings → Credentials → Add Credential
- [ ] Sélectionner "Postgres"
- [ ] Name: `Supabase PostgreSQL`
- [ ] Host: `db.tqwmtrhfzaugkrwjcofq.supabase.co`
- [ ] Database: `postgres`
- [ ] User: `postgres`
- [ ] Password: `[REMPLIR]`
- [ ] Port: `5432`
- [ ] SSL Mode: `require`
- [ ] Cliquer "Test"
- [ ] Vérifier ✅ "Connection successful"
- [ ] Cliquer "Save"

### Anthropic Claude API

- [ ] Settings → Credentials → Add Credential
- [ ] Sélectionner "Anthropic Claude API"
- [ ] Name: `Anthropic Claude API`
- [ ] API Key: `sk-ant-api03-[REMPLIR]`
- [ ] Cliquer "Save"

---

## 📥 Import Workflow

- [ ] Workflows (menu gauche)
- [ ] Add → Import from File
- [ ] Sélectionner `chatbot-message-processing.json`
- [ ] Workflow s'ouvre avec 22 nœuds visibles

---

## 🔗 Lier Credentials aux Nœuds

### Nœuds PostgreSQL (5 nœuds)

- [ ] **Rate Limit Check** → Credentials → `Supabase PostgreSQL`
- [ ] **Load Conversation History** → Credentials → `Supabase PostgreSQL`
- [ ] **Save Conversation** → Credentials → `Supabase PostgreSQL`
- [ ] **Save User Message** → Credentials → `Supabase PostgreSQL`
- [ ] **Save Bot Message** → Credentials → `Supabase PostgreSQL`

### Nœud Claude API (1 nœud)

- [ ] **Claude API Call** → Authentication → `Predefined Credential Type`
- [ ] Credential Type → `Anthropic API`
- [ ] Credential → `Anthropic Claude API`

---

## ✅ Activation

- [ ] Cliquer "Save" (en haut à droite)
- [ ] Vérifier message "Workflow saved" ✅
- [ ] Toggle "Inactive" → "Active"
- [ ] Vérifier toggle devient vert ✅

---

## 🧪 Tests

### Test 1: Webhook Basic

- [ ] Copier commande curl du guide
- [ ] Exécuter dans terminal
- [ ] Vérifier réponse JSON reçue
- [ ] Vérifier status 200

### Test 2: Exécutions n8n

- [ ] Aller dans Executions (menu gauche)
- [ ] Vérifier exécution récente visible
- [ ] Cliquer sur l'exécution
- [ ] Vérifier tous nœuds verts ✅

### Test 3: Supabase

- [ ] Ouvrir Supabase dashboard
- [ ] Table Editor → `conversations`
- [ ] Vérifier conversation test visible
- [ ] Table Editor → `messages`
- [ ] Vérifier 2 messages (user + assistant)

---

## 🔧 Configuration Nginx (Optionnel)

Si URL personnalisée désirée:

- [ ] SSH au VPS: `ssh root@147.79.100.35`
- [ ] Éditer: `nano /etc/nginx/sites-available/chat.lagencedescopines.com`
- [ ] Ajouter location `/webhook/chat`
- [ ] Remplacer `[WORKFLOW-ID]` par ID réel
- [ ] Sauvegarder: Ctrl+O, Enter, Ctrl+X
- [ ] Tester: `nginx -t`
- [ ] Recharger: `systemctl reload nginx`
- [ ] Tester URL: `curl https://chat.lagencedescopines.com/webhook/chat`

---

## 🎯 Vérification Finale

- [ ] Workflow actif (toggle vert)
- [ ] Test curl réussit
- [ ] Exécution visible dans n8n
- [ ] Messages sauvegardés dans Supabase
- [ ] Temps réponse <10 secondes
- [ ] Pas d'erreurs dans logs

---

## 📊 Monitoring (Post-Installation)

### Vérifications Quotidiennes

- [ ] n8n Executions: Vérifier pas d'erreurs
- [ ] Supabase: Vérifier messages entrants
- [ ] Logs: `docker compose logs --tail=50 n8n`

### Métriques Hebdomadaires

- [ ] Nombre total de conversations
- [ ] Messages par jour
- [ ] Répartition agents (Création vs Automation)
- [ ] Temps de réponse moyen
- [ ] Taux d'erreur

---

## 🆘 Dépannage Rapide

### Problème: Workflow ne s'active pas
- [ ] Vérifier toutes credentials liées
- [ ] Sauvegarder à nouveau
- [ ] Recharger page n8n
- [ ] Voir logs: `docker compose logs n8n | tail -50`

### Problème: Test curl échoue
- [ ] Vérifier workflow actif
- [ ] Vérifier URL correcte
- [ ] Vérifier JSON valide
- [ ] Tester directement production URL du webhook

### Problème: Messages pas dans Supabase
- [ ] Vérifier credentials PostgreSQL
- [ ] Tester connexion manuellement: `psql -h db.tqwmtrhfzaugkrwjcofq.supabase.co -U postgres -d postgres`
- [ ] Vérifier nœuds Save ont credentials

### Problème: Claude API erreur
- [ ] Vérifier clé API valide
- [ ] Tester avec curl direct
- [ ] Vérifier quota API Anthropic
- [ ] Régénérer clé si nécessaire

---

## ✅ Sign-Off

Intégration complète quand toutes les cases sont cochées:

- [ ] Credentials configurées (2/2)
- [ ] Workflow importé
- [ ] Credentials liées (6/6 nœuds)
- [ ] Workflow actif
- [ ] Tests passent (3/3)
- [ ] Monitoring en place

**Signature**: ________________  **Date**: ________

---

## 📞 Support

**Documentation**:
- Guide rapide: `INTEGRATION_5MIN.md`
- Guide complet: `QUICK_START.md`
- Guide visuel: `INTEGRATION_VISUELLE.md`
- Dépannage: `DEPLOYMENT.md` section Troubleshooting

**Contact**: benoit@lagencedescopines.com

---

**Version**: 1.0.0
**Date**: 2025-11-03
**Epic**: 3 - n8n AI Orchestration Backend
