# Backend v2 - Index de Documentation

Guide pour naviguer dans la documentation complète du backend v2.

---

## 🎯 Par Objectif

### Je veux démarrer rapidement

→ **`README.md`** (20 minutes)
- Installation complète
- Configuration .env
- Tests basiques
- Commandes essentielles

### Je veux comprendre l'architecture

→ **`/n8n-workflows-v2/ARCHITECTURE_V2_FINALE.md`** (30 minutes)
- Architecture détaillée
- Décisions techniques
- Comparaison avec v1
- Diagrammes et code examples

→ **`/n8n-workflows-v2/ARCHITECTURE_REELLE.md`** (15 minutes)
- Version condensée
- Problèmes résolus
- Vue d'ensemble système

### Je veux déployer en production

→ **`DEPLOYMENT.md`** (1-2 heures)
- 3 options de déploiement (VPS, Serverless, Cohabitation)
- Configuration Nginx
- Monitoring production
- Troubleshooting

### Je veux migrer depuis v1

→ **`MIGRATION_V1_TO_V2.md`** (Plan complet)
- Comparaison v1 vs v2
- Plan de migration en 4 phases
- A/B testing
- Rollback strategy

---

## 📚 Par Type de Documentation

### Guides Principaux

| Fichier | Description | Durée | Audience |
|---------|-------------|-------|----------|
| `README.md` | Installation et usage | 20 min | Tous |
| `DEPLOYMENT.md` | Déploiement production | 1-2h | DevOps |
| `MIGRATION_V1_TO_V2.md` | Migration depuis v1 | Plan complet | Tech Lead |

### Documentation Technique

| Fichier | Description | Contenu |
|---------|-------------|---------|
| `ARCHITECTURE_V2_FINALE.md` | Architecture complète | 400+ lignes, tous détails |
| `ARCHITECTURE_REELLE.md` | Architecture condensée | Vue d'ensemble rapide |
| `.env.example` | Variables environnement | Template commenté |
| `requirements.txt` | Dépendances Python | Versions fixées |

### Code Source

| Dossier/Fichier | Description | Lignes |
|-----------------|-------------|--------|
| `main.py` | Application FastAPI | ~100 |
| `config/settings.py` | Configuration centralisée | ~80 |
| `services/openrouter_client.py` | Client OpenRouter + agents | ~250 |
| `services/rag_service.py` | Pipeline RAG dual | ~200 |
| `services/conversation_service.py` | Gestion historique | ~150 |
| `api/chat.py` | Endpoints API | ~150 |
| `models/schemas.py` | Modèles Pydantic | ~70 |
| `database/migrations.sql` | Migrations Supabase | ~300 |

---

## 🔍 Par Niveau d'Expertise

### Débutant Backend

**Recommandé**:
1. `README.md` - Comprendre le système
2. `ARCHITECTURE_REELLE.md` - Vue d'ensemble
3. Tests locaux avec curl

**Temps total**: 30-45 minutes

### Développeur Backend

**Recommandé**:
1. `README.md` - Installation rapide
2. `ARCHITECTURE_V2_FINALE.md` - Détails techniques
3. Code source - Review implementation
4. `DEPLOYMENT.md` - Options déploiement

**Temps total**: 1-2 heures

### DevOps / Tech Lead

**Recommandé**:
1. `DEPLOYMENT.md` - Stratégies déploiement
2. `MIGRATION_V1_TO_V2.md` - Plan migration
3. Monitoring et analytics
4. Architecture pour scaling

**Temps total**: 2-3 heures

---

## 🎓 Par Besoin

### J'ai un problème d'installation

1. **`README.md`** → Section "Installation"
2. **`DEPLOYMENT.md`** → Section "Troubleshooting Production"
3. Check logs: `docker logs chatbot-v2`

### Je veux comprendre le RAG

1. **`services/rag_service.py`** - Implémentation complète
2. **`ARCHITECTURE_V2_FINALE.md`** → Section "Pipeline RAG Complet"
3. **`database/migrations.sql`** → Fonctions `match_documents_*`

### Je veux modifier les agents

1. **`services/openrouter_client.py`** → Méthodes `audrey_response()` et `carole_response()`
2. **`ARCHITECTURE_V2_FINALE.md`** → Section "Agents Spécialisés"
3. Modifier prompts système
4. Redeploy

### Je veux ajouter un troisième agent

1. Lire **`services/openrouter_client.py`** - Pattern agents
2. Modifier orchestrator prompt
3. Ajouter méthode `{agent}_response()`
4. Créer `rag_{agent}()` dans `rag_service.py`
5. Update database avec `agent_owner={agent}`

### Je veux monitorer la production

1. **`DEPLOYMENT.md`** → Section "Monitoring Production"
2. **`database/migrations.sql`** → View `agent_analytics`
3. Logs: `docker logs chatbot-v2 -f`
4. Metrics Supabase

---

## 📖 Parcours Recommandés

### Parcours 1: Installation Locale (Première Fois)

```
1. README.md                [Lire installation, 10 min]
   ↓
2. Créer .env              [Copier .env.example, remplir clés, 5 min]
   ↓
3. database/migrations.sql [Exécuter dans Supabase, 5 min]
   ↓
4. pip install -r requirements.txt [Install, 2 min]
   ↓
5. python main.py          [Start server, test]
   ↓
6. curl tests              [Vérifier endpoints, 5 min]
```

**Temps total**: 30 minutes

### Parcours 2: Compréhension Technique Complète

```
1. ARCHITECTURE_REELLE.md     [Vue d'ensemble, 15 min]
   ↓
2. ARCHITECTURE_V2_FINALE.md  [Détails complets, 30 min]
   ↓
3. Code review                [services/, api/, 30 min]
   ↓
4. database/migrations.sql    [Schema et fonctions, 15 min]
   ↓
5. Tests pratiques            [Modifier et tester, 30 min]
```

**Temps total**: 2 heures

### Parcours 3: Déploiement Production

```
1. DEPLOYMENT.md              [Lire intégral, 30 min]
   ↓
2. Choisir option déploiement [VPS/Serverless/Hybrid, 10 min]
   ↓
3. Setup serveur              [Suivre guide, 1-2h]
   ↓
4. Tests production           [Health, API, monitoring, 30 min]
   ↓
5. MIGRATION_V1_TO_V2.md      [Plan migration si v1 existe, 30 min]
```

**Temps total**: 3-4 heures

### Parcours 4: Migration v1 → v2

```
1. MIGRATION_V1_TO_V2.md      [Lire plan complet, 30 min]
   ↓
2. Phase 1: Préparation       [Setup v2 en parallèle, 1-2h]
   ↓
3. Phase 2: A/B Test          [10% traffic, monitor 2-3 jours]
   ↓
4. Phase 3: Migration         [Progressive 50→75→100%, 1 semaine]
   ↓
5. Phase 4: Cleanup           [Retirer v1, archiver, 1h]
```

**Temps total**: ~2 semaines (dont monitoring)

---

## 🔧 Référence Rapide

### Commandes Essentielles

```bash
# Installation
pip install -r requirements.txt

# Démarrer localement
python main.py

# Démarrer avec Docker
docker compose up -d --build

# Logs
docker logs chatbot-v2 -f

# Health check
curl http://localhost:8000/health

# Test chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "conversation_id": "test-1",
    "message": "Hello",
    "timestamp": "2025-11-03T12:00:00Z"
  }'
```

### Fichiers Clés

```
backend-v2/
├── main.py                          ← Point d'entrée FastAPI
├── .env.example                     ← Template configuration
├── requirements.txt                 ← Dépendances Python
├── README.md                        ← Guide principal
├── DEPLOYMENT.md                    ← Guide déploiement
├── MIGRATION_V1_TO_V2.md           ← Plan migration
├── config/
│   └── settings.py                  ← Configuration centralisée
├── services/
│   ├── openrouter_client.py        ← LLM calls + agents
│   ├── rag_service.py              ← RAG pipeline
│   └── conversation_service.py      ← Historique
├── api/
│   └── chat.py                      ← Endpoints
├── models/
│   └── schemas.py                   ← Pydantic models
└── database/
    └── migrations.sql               ← Migrations Supabase
```

### URLs Importantes

```
Local:
- Server:     http://localhost:8000
- Health:     http://localhost:8000/health
- Docs:       http://localhost:8000/docs
- Chat:       http://localhost:8000/api/chat

Production:
- Server:     https://chat.lagencedescopines.com/api/v2
- Health:     https://chat.lagencedescopines.com/health
- Chat:       https://chat.lagencedescopines.com/api/v2/chat
```

### Variables d'Environnement Critiques

```env
# Obligatoires
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-key
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENAI_API_KEY=sk-xxx
COHERE_API_KEY=xxx

# Optionnelles (ont defaults)
ORCHESTRATOR_MODEL=anthropic/claude-3-haiku
AUDREY_MODEL=anthropic/claude-3.5-sonnet
CAROLE_MODEL=anthropic/claude-3.5-sonnet
RAG_SIMILARITY_THRESHOLD=0.7
RATE_LIMIT_MESSAGES=10
```

---

## 📊 Matrice de Documentation

| Besoin | Fichier | Section | Temps |
|--------|---------|---------|-------|
| Installation rapide | README.md | Installation | 20 min |
| Architecture overview | ARCHITECTURE_REELLE.md | - | 15 min |
| Architecture détaillée | ARCHITECTURE_V2_FINALE.md | - | 30 min |
| Déploiement VPS | DEPLOYMENT.md | Option 1 | 2h |
| Déploiement Serverless | DEPLOYMENT.md | Option 2 | 1h |
| Migration depuis v1 | MIGRATION_V1_TO_V2.md | - | Plan complet |
| Troubleshooting | DEPLOYMENT.md | Troubleshooting | 10 min |
| Configuration | .env.example + README | - | 5 min |
| Monitoring | DEPLOYMENT.md | Monitoring | 15 min |
| Modifier agents | openrouter_client.py | Prompts | 30 min |
| Modifier RAG | rag_service.py | Pipeline | 30 min |

---

## 🆘 En Cas de Problème

### Problème d'installation locale

1. Vérifier `README.md` → Installation
2. Check Python version: `python --version` (doit être 3.11+)
3. Vérifier `.env` correctement configuré
4. Logs: `python main.py` (erreurs visibles)

### Erreur au déploiement

1. `DEPLOYMENT.md` → Troubleshooting
2. Logs Docker: `docker logs chatbot-v2`
3. Health check: `curl http://localhost:8000/health`
4. Vérifier toutes variables .env présentes

### RAG ne retourne rien

1. Vérifier migrations exécutées: `database/migrations.sql`
2. Check documents taggés:
   ```sql
   SELECT agent_owner, COUNT(*) FROM documents GROUP BY agent_owner;
   ```
3. Si NULL → Re-run migrations
4. Vérifier embeddings existent:
   ```sql
   SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL;
   ```

### Migration v1 → v2 bloquée

1. `MIGRATION_V1_TO_V2.md` → Rollback Plan
2. Forcer v1 dans widget: `USE_V2_PERCENTAGE = 0`
3. Identifier problème dans logs v2
4. Fix et retry migration progressive

---

## 📞 Support & Contact

**Documentation complète**: Tous fichiers dans `/backend-v2/`
**Architecture v2**: `/n8n-workflows-v2/ARCHITECTURE_V2_FINALE.md`
**Project status**: `/PROJECT_STATUS.md`
**Contact**: benoit@lagencedescopines.com

---

## 📝 Historique

**v2.0.0** (2025-11-03)
- Backend FastAPI complet
- Agents Audrey + Carole avec personas
- RAG dual avec reranker multilingue
- Orchestrateur LLM intelligent
- OpenRouter avec fallbacks
- Async/parallel processing
- 60% plus rapide que v1
- 8 fichiers documentation
- Production-ready

**Comparé à v1** (n8n workflow):
- ✅ 3.5s vs 8-10s (60% plus rapide)
- ✅ RAG complet (vs placeholder)
- ✅ Orchestration intelligente (vs keywords)
- ✅ Concurrence async (vs séquentiel)
- ✅ Agents spécialisés (vs générique)
- ✅ Monitoring par agent

---

**Navigation Rapide**:
- [→ Installation](README.md)
- [→ Architecture](../n8n-workflows-v2/ARCHITECTURE_V2_FINALE.md)
- [→ Déploiement](DEPLOYMENT.md)
- [→ Migration v1→v2](MIGRATION_V1_TO_V2.md)
