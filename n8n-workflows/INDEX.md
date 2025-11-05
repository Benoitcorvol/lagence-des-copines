# Documentation n8n Workflows - Index

Guide pour naviguer dans la documentation complète.

---

## 🎯 Par Objectif

### Je veux intégrer le workflow rapidement

→ **`INTEGRATION_5MIN.md`** (5 minutes)
- Guide ultra-concis
- Commandes essentielles seulement
- Parfait pour les développeurs expérimentés

### Je veux un guide pas-à-pas visuel

→ **`INTEGRATION_VISUELLE.md`** (15 minutes)
- Descriptions visuelles de chaque écran
- Screenshots simulés en ASCII
- Explications détaillées de chaque action

### Je veux un guide complet avec explications

→ **`QUICK_START.md`** (30 minutes)
- 7 étapes détaillées
- Section troubleshooting complète
- Tests et vérifications inclus

### Je veux une checklist à suivre

→ **`CHECKLIST.md`** (imprimable)
- Format checklist avec cases à cocher
- Toutes les étapes listées
- Section sign-off pour validation

---

## 📚 Par Type de Documentation

### Guides d'Intégration

| Fichier | Description | Durée | Audience |
|---------|-------------|-------|----------|
| `INTEGRATION_5MIN.md` | Guide express | 5 min | Experts |
| `INTEGRATION_VISUELLE.md` | Guide visuel | 15 min | Débutants |
| `QUICK_START.md` | Guide complet | 30 min | Tous |
| `CHECKLIST.md` | Liste de vérification | - | Tous |

### Documentation Technique

| Fichier | Description | Contenu |
|---------|-------------|---------|
| `README.md` | Architecture workflow | 600+ lignes, détails techniques |
| `IMPLEMENTATION_SUMMARY.md` | Résumé Epic 3 | Stories, décisions, métriques |
| `DEPLOYMENT.md` | Déploiement VPS | 12 étapes, configuration serveur |
| `.env.example` | Variables environnement | Template avec commentaires |

### Code

| Fichier | Description | Taille |
|---------|-------------|--------|
| `chatbot-message-processing.json` | Workflow n8n complet | 850+ lignes, 22 nœuds |

---

## 🔍 Par Niveau d'Expertise

### Débutant n8n

**Recommandé**:
1. `INTEGRATION_VISUELLE.md` - Comprendre l'interface
2. `CHECKLIST.md` - Suivre étape par étape
3. `QUICK_START.md` - Référence si problème

**Temps total**: 30-45 minutes

### Intermédiaire n8n

**Recommandé**:
1. `QUICK_START.md` - Vue d'ensemble
2. `CHECKLIST.md` - Validation
3. `README.md` - Comprendre architecture

**Temps total**: 20-30 minutes

### Expert n8n

**Recommandé**:
1. `INTEGRATION_5MIN.md` - Intégration rapide
2. `README.md` - Architecture et tests
3. `IMPLEMENTATION_SUMMARY.md` - Décisions techniques

**Temps total**: 10-15 minutes

---

## 🎓 Par Besoin

### J'ai un problème d'intégration

1. **`CHECKLIST.md`** - Vérifier toutes les étapes
2. **`QUICK_START.md`** → Section "En Cas de Problème"
3. **`DEPLOYMENT.md`** → Section "Dépannage"

### Je veux comprendre l'architecture

1. **`README.md`** → Section "Architecture du Workflow"
2. **`IMPLEMENTATION_SUMMARY.md`** → Section "Technical Achievements"
3. **`chatbot-message-processing.json`** - Code source

### Je veux déployer en production

1. **`DEPLOYMENT.md`** - Guide complet 12 étapes
2. **`CHECKLIST.md`** - Validation déploiement
3. **`.env.example`** - Configuration production

### Je veux tester le workflow

1. **`README.md`** → Section "Tests" (6 scénarios)
2. **`QUICK_START.md`** → Étape 7: Tester le Workflow
3. **`DEPLOYMENT.md`** → Étape 10: Tester le Déploiement

### Je veux monitorer en production

1. **`README.md`** → Section "Monitoring & Debugging"
2. **`DEPLOYMENT.md`** → Section "Monitoring"
3. **`QUICK_START.md`** → Section "Monitoring"

---

## 📖 Parcours Recommandés

### Parcours 1: Installation Complète (Première Fois)

```
1. INTEGRATION_VISUELLE.md    [Lire, 10 min]
   ↓
2. CHECKLIST.md               [Imprimer, suivre]
   ↓
3. QUICK_START.md             [Référence si besoin]
   ↓
4. DEPLOYMENT.md              [Si déploiement VPS]
```

**Temps total**: 1-2 heures

### Parcours 2: Installation Rapide (Expérimenté)

```
1. INTEGRATION_5MIN.md        [5 min]
   ↓
2. Intégration directe
   ↓
3. README.md (si problème)
```

**Temps total**: 10-15 minutes

### Parcours 3: Compréhension Technique

```
1. IMPLEMENTATION_SUMMARY.md  [20 min]
   ↓
2. README.md                   [30 min]
   ↓
3. chatbot-message-processing.json [Code review]
```

**Temps total**: 1 heure

### Parcours 4: Déploiement Production

```
1. DEPLOYMENT.md               [Lire intégral]
   ↓
2. CHECKLIST.md               [Validation]
   ↓
3. README.md → Monitoring     [Setup monitoring]
```

**Temps total**: 2-3 heures

---

## 🔧 Référence Rapide

### Commandes Essentielles

```bash
# Accéder n8n
https://chat.lagencedescopines.com/n8n/

# Logs n8n
docker compose logs -f n8n

# Test webhook
curl -X POST https://chat.lagencedescopines.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","conversationId":"test","message":"Hello!","timestamp":"2025-11-03T12:00:00Z"}'

# Redémarrer n8n
docker compose restart n8n
```

### Fichiers Clés

```
/Users/benoitcorvol/chatbot/chatbot/n8n-workflows/
├── chatbot-message-processing.json  ← Workflow à importer
├── INTEGRATION_5MIN.md              ← Guide rapide
├── INTEGRATION_VISUELLE.md          ← Guide visuel
├── QUICK_START.md                   ← Guide complet
├── CHECKLIST.md                     ← Liste vérification
├── README.md                        ← Documentation technique
├── DEPLOYMENT.md                    ← Déploiement VPS
├── IMPLEMENTATION_SUMMARY.md        ← Résumé Epic 3
└── .env.example                     ← Variables environnement
```

### URLs Importantes

```
n8n UI:       https://chat.lagencedescopines.com/n8n/
Webhook:      https://chat.lagencedescopines.com/webhook/chat
Supabase:     https://supabase.com/dashboard/project/tqwmtrhfzaugkrwjcofq
Anthropic:    https://console.anthropic.com/settings/keys
```

---

## 📊 Matrice de Documentation

| Besoin | Fichier | Section | Temps |
|--------|---------|---------|-------|
| Intégration rapide | INTEGRATION_5MIN.md | - | 5 min |
| Intégration visuelle | INTEGRATION_VISUELLE.md | - | 15 min |
| Intégration complète | QUICK_START.md | - | 30 min |
| Validation | CHECKLIST.md | - | - |
| Architecture | README.md | Architecture | 20 min |
| Tests | README.md | Tests | 10 min |
| Dépannage | QUICK_START.md | En Cas de Problème | 5 min |
| Déploiement | DEPLOYMENT.md | - | 2h |
| Monitoring | README.md | Monitoring | 10 min |
| Détails techniques | IMPLEMENTATION_SUMMARY.md | - | 30 min |
| Variables env | .env.example | - | 5 min |

---

## 🆘 En Cas de Problème

### Problème d'intégration

1. Vérifier `CHECKLIST.md` - toutes cases cochées?
2. Relire `QUICK_START.md` → "En Cas de Problème"
3. Consulter `DEPLOYMENT.md` → "Dépannage"

### Erreur workflow

1. Logs: `docker compose logs n8n | tail -50`
2. n8n UI → Executions → Voir détails erreur
3. `README.md` → Section "Dépannage"

### Question architecture

1. `IMPLEMENTATION_SUMMARY.md` → Technical Achievements
2. `README.md` → Architecture du Workflow
3. Code: `chatbot-message-processing.json`

---

## 📞 Support & Contact

**Documentation complète**: Tous les fichiers dans `/n8n-workflows/`
**Project status**: `/PROJECT_STATUS.md`
**Contact**: benoit@lagencedescopines.com

---

## 📝 Historique

**v1.0.0** (2025-11-03)
- 9 fichiers de documentation
- 3,000+ lignes de documentation
- 4 guides d'intégration différents
- 1 workflow complet (850+ lignes)

**Epic**: 3 - n8n AI Orchestration Backend (100% complete)

---

**Navigation**:
- [← Retour README principal](/README.md)
- [→ Guide rapide](INTEGRATION_5MIN.md)
- [→ Guide visuel](INTEGRATION_VISUELLE.md)
- [→ Guide complet](QUICK_START.md)
