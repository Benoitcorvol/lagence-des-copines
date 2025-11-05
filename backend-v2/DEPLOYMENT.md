# Guide de Déploiement - Chatbot v2

Guide complet pour déployer le backend v2 en production.

---

## 🎯 Options de Déploiement

### Option 1: VPS avec Docker (Recommandé)

Déployer sur le VPS existant (147.79.100.35) avec Docker.

### Option 2: Serverless (Railway, Render, Fly.io)

Déploiement serverless sans gestion de serveur.

### Option 3: Service existant (Modifier n8n)

Garder n8n et ajouter le backend v2 en service séparé.

---

## 📦 Option 1: Déploiement VPS avec Docker

### Étape 1: Préparer le serveur

```bash
# SSH au VPS
ssh root@147.79.100.35

# Créer répertoire pour backend v2
mkdir -p /opt/chatbot-v2
cd /opt/chatbot-v2
```

### Étape 2: Upload les fichiers

Depuis votre machine locale:

```bash
# Depuis /Users/benoitcorvol/chatbot/chatbot/backend-v2
scp -r * root@147.79.100.35:/opt/chatbot-v2/
```

### Étape 3: Créer Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Étape 4: Créer docker-compose.yml

```yaml
version: '3.8'

services:
  chatbot-v2:
    build: .
    container_name: chatbot-v2
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - .env
    networks:
      - chatbot-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  chatbot-network:
    driver: bridge
```

### Étape 5: Configurer .env

```bash
cd /opt/chatbot-v2
nano .env
```

Remplir avec vos clés:
```env
# Supabase
SUPABASE_URL=https://tqwmtrhfzaugkrwjcofq.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Cohere
COHERE_API_KEY=your-cohere-key

# Optional: Production settings
API_HOST=0.0.0.0
API_PORT=8000
```

### Étape 6: Exécuter migrations Supabase

Avant de démarrer le backend, exécuter migrations:

1. Aller sur https://supabase.com/dashboard/project/tqwmtrhfzaugkrwjcofq
2. SQL Editor → New Query
3. Copier contenu de `database/migrations.sql`
4. Run

### Étape 7: Build et démarrer

```bash
cd /opt/chatbot-v2
docker compose up -d --build
```

### Étape 8: Configurer Nginx

Ajouter reverse proxy:

```bash
nano /etc/nginx/sites-available/chat.lagencedescopines.com
```

Ajouter location pour API v2:
```nginx
# Backend v2 API
location /api/v2/ {
    proxy_pass http://localhost:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Health check
location /health {
    proxy_pass http://localhost:8000/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

Tester et recharger:
```bash
nginx -t
systemctl reload nginx
```

### Étape 9: Vérifier déploiement

```bash
# Check logs
docker logs chatbot-v2 -f

# Test health endpoint
curl https://chat.lagencedescopines.com/health

# Test API
curl -X POST https://chat.lagencedescopines.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "conversation_id": "test-prod",
    "message": "Hello",
    "timestamp": "2025-11-03T12:00:00Z"
  }'
```

---

## 🚀 Option 2: Déploiement Serverless (Railway)

### Étape 1: Créer compte Railway

1. Aller sur https://railway.app
2. Sign up avec GitHub
3. New Project → Deploy from GitHub repo

### Étape 2: Configurer repository

```bash
# Dans backend-v2, créer railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Étape 3: Variables d'environnement

Dans Railway dashboard → Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `COHERE_API_KEY`
- `PORT` (Railway auto-génère)

### Étape 4: Deploy

Railway auto-deploy à chaque push sur main.

URL générée: `https://your-app.railway.app`

### Étape 5: Custom domain (optionnel)

Railway → Settings → Domains → Add Custom Domain

Configurer DNS:
```
CNAME api-chatbot.lagencedescopines.com → your-app.railway.app
```

---

## 🔄 Option 3: Cohabitation avec n8n

Garder n8n ET ajouter backend v2.

### Architecture

```
Nginx (443)
 ├─ /n8n/* → n8n service (port 5678)
 ├─ /webhook/chat → n8n webhook (ancien système)
 ├─ /api/v2/* → Backend v2 (port 8000)
 └─ /health → Backend v2 health
```

### Modifier docker-compose

Sur VPS, modifier `/opt/chatbot/docker-compose.yml`:

```yaml
version: '3.8'

services:
  n8n:
    # Configuration existante...

  chatbot-v2:
    build: /opt/chatbot-v2
    container_name: chatbot-v2
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - /opt/chatbot-v2/.env
    networks:
      - chatbot-network

networks:
  chatbot-network:
    driver: bridge
```

Démarrer:
```bash
docker compose up -d chatbot-v2
```

---

## 🔌 Intégration Widget

### Modifier le widget pour appeler v2

Dans `chat-widget/src/services/chatService.ts`:

```typescript
// Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://chat.lagencedescopines.com/api/v2'
  : 'http://localhost:8000/api';

// Fonction sendMessage
export async function sendMessage(
  userId: string,
  conversationId: string,
  message: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    throw new Error(`Erreur API: ${response.status}`);
  }

  const data = await response.json();

  return {
    message: data.message,
    agent: data.agent,
    confidence: data.confidence,
    timestamp: data.timestamp,
  };
}

// Fonction checkRateLimit
export async function checkRateLimit(
  conversationId: string
): Promise<RateLimitStatus> {
  const response = await fetch(
    `${API_BASE_URL}/rate-limit/${conversationId}`
  );

  if (!response.ok) {
    return { allowed: true, remaining: 10 };
  }

  return await response.json();
}
```

### Afficher indicateur agent

Dans le widget, afficher quel agent répond:

```typescript
// Dans ChatMessage.tsx
interface ChatMessageProps {
  message: string;
  isUser: boolean;
  agent?: 'audrey' | 'carole' | 'escalate';
  timestamp: string;
}

export function ChatMessage({ message, isUser, agent }: ChatMessageProps) {
  const agentInfo = {
    audrey: { name: 'Audrey', emoji: '👩‍💼', color: 'purple' },
    carole: { name: 'Carole', emoji: '🎨', color: 'pink' },
  };

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && agent && agentInfo[agent] && (
        <div className="agent-badge" style={{ color: agentInfo[agent].color }}>
          {agentInfo[agent].emoji} {agentInfo[agent].name}
        </div>
      )}
      <p>{message}</p>
    </div>
  );
}
```

---

## 📊 Monitoring Production

### Logs

```bash
# Docker logs
docker logs chatbot-v2 -f --tail 100

# Filtrer par niveau
docker logs chatbot-v2 2>&1 | grep ERROR
docker logs chatbot-v2 2>&1 | grep WARNING
```

### Métriques importantes

1. **Temps de réponse**: Objectif <5s
2. **Taux d'erreur**: Objectif <1%
3. **Rate limit hits**: Combien de fois déclenché
4. **Distribution agents**: % Audrey vs Carole vs Escalate

### Analytics Supabase

Requêtes utiles:

```sql
-- Messages par agent (dernières 24h)
SELECT
  agent,
  COUNT(*) as count,
  COUNT(DISTINCT conversation_id) as unique_conversations
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND role = 'assistant'
GROUP BY agent;

-- Temps de réponse moyen par agent
SELECT
  m1.agent,
  AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))) as avg_response_time_seconds
FROM messages m1
JOIN messages m2 ON m1.conversation_id = m2.conversation_id
WHERE m1.role = 'user'
  AND m2.role = 'assistant'
  AND m2.created_at > m1.created_at
  AND m1.created_at > NOW() - INTERVAL '24 hours'
GROUP BY m1.agent;

-- Rate limit violations
SELECT
  conversation_id,
  COUNT(*) as message_count,
  MAX(created_at) as last_message
FROM messages
WHERE created_at > NOW() - INTERVAL '1 minute'
GROUP BY conversation_id
HAVING COUNT(*) > 10;
```

---

## 🐛 Troubleshooting Production

### Backend ne démarre pas

```bash
# Check logs
docker logs chatbot-v2

# Common issues:
# - Variables .env manquantes → Vérifier .env
# - Port 8000 déjà utilisé → docker ps | grep 8000
# - Erreur import → Rebuild image: docker compose up -d --build
```

### Erreurs API OpenRouter

```bash
# Vérifier clé valide
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Tester fallback model
# Logs montreront retry avec fallback si modèle principal down
```

### RAG ne retourne rien

```bash
# Vérifier documents taggés
# Dans Supabase SQL Editor:
SELECT agent_owner, COUNT(*) FROM documents GROUP BY agent_owner;

# Si NULL ou 0 → Re-run migrations
# Si documents mais pas de résultats → Check embeddings:
SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL;
```

### Performance lente

1. **Check indexes**:
```sql
SELECT * FROM pg_indexes WHERE tablename IN ('documents', 'document_chunks', 'messages');
```

2. **Augmenter workers**:
```yaml
# docker-compose.yml
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "8"]
```

3. **Réduire RAG initial results**:
```env
RAG_INITIAL_RESULTS=10  # Au lieu de 20
```

---

## 🔄 Mise à Jour Production

### Rolling update

```bash
cd /opt/chatbot-v2

# Pull latest code
git pull origin main

# Rebuild
docker compose up -d --build

# Check health
curl https://chat.lagencedescopines.com/health
```

### Zero-downtime update

```bash
# Build new image
docker compose build

# Start new container
docker compose up -d --no-deps --scale chatbot-v2=2 chatbot-v2

# Wait for health check
sleep 10

# Stop old container
docker compose up -d --no-deps --scale chatbot-v2=1 chatbot-v2
```

---

## 📞 Support

**Logs**: `docker logs chatbot-v2 -f`
**Health**: `curl https://chat.lagencedescopines.com/health`
**Contact**: benoit@lagencedescopines.com

---

**Version**: 2.0.0
**Date**: 2025-11-03
