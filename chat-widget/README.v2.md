# L'Agence des Copines - Chat Widget v2.0 (Modular)

Widget de chat IA modulaire avec tests automatisés pour L'Agence des Copines.

## 🎯 Nouveautés v2.0

- **Architecture modulaire** : Code séparé en modules logiques
- **Tests automatisés** : 60+ tests avec Vitest
- **Build moderne** : Vite pour un développement rapide
- **Meilleure maintenabilité** : JSDoc, structure claire
- **Bundle optimisé** : 5.44 KB gzippé

## 📦 Structure du projet

```
chat-widget/
├── src/
│   ├── modules/              # Modules réutilisables
│   │   ├── config.js         # Configuration et constantes
│   │   ├── utils.js          # Fonctions utilitaires
│   │   ├── storage.js        # Gestion localStorage
│   │   ├── api.js            # Communication API
│   │   ├── styles.js         # Styles CSS
│   │   ├── template.js       # Template HTML
│   │   └── ChatWidget.js     # Composant principal
│   └── main.js               # Point d'entrée
│
├── tests/
│   ├── setup.js              # Configuration tests
│   └── unit/                 # Tests unitaires
│       ├── utils.test.js
│       ├── storage.test.js
│       ├── api.test.js
│       └── ChatWidget.test.js
│
├── dist/                     # Build production (généré)
├── test/                     # Pages de test HTML
├── vite.config.js            # Config Vite
├── vitest.config.js          # Config Vitest
└── package.json
```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Développement

```bash
# Serveur de dev avec HMR
npm run dev

# Tests en mode watch
npm test

# Tests avec UI
npm run test:ui
```

### Tests

```bash
# Tous les tests
npm test

# Tests une fois (CI)
npm run test:once

# Coverage
npm run test:coverage
```

### Build

```bash
# Build production
npm run build

# Preview du build
npm run preview
```

## 📝 Modules

### config.js
Configuration centrale du widget :
- URL de l'API
- Couleurs de la marque
- Timeouts et limites
- Messages d'erreur

### utils.js
Fonctions utilitaires :
- `generateUUID()` : Génération d'ID unique
- `escapeHtml()` : Protection XSS
- `formatTime()` : Formatage dates
- `debug()` : Logging conditionnel

### storage.js
Gestion du localStorage :
- `getUserId()` : ID utilisateur persistant
- `getConversationId()` : ID conversation
- `loadMessagesFromCache()` : Cache messages (5min TTL)
- `saveMessagesToCache()` : Sauvegarde cache
- `resetConversation()` : Nouvelle conversation

### api.js
Communication serveur :
- `sendMessageToAPI()` : Envoi messages avec retry
- `getErrorType()` : Détection type d'erreur

### ChatWidget.js
Composant Web Component :
- Shadow DOM pour isolation
- Gestion des events
- Rendu des messages
- Typing indicator
- Gestion d'erreurs

## 🧪 Tests

### Couverture actuelle

| Module | Tests | Status |
|--------|-------|--------|
| utils.js | 16 | ✅ Tous passent |
| storage.js | 13 | ✅ Tous passent |
| api.js | 12 | ✅ 9/12 (3 skipped*) |
| ChatWidget.js | 22 | ✅ Tous passent |

*Note : 3 tests d'erreur API sont temporairement skippés (problème de mock fetch)

### Lancer les tests

```bash
# Watch mode
npm test

# Interface visuelle
npm run test:ui

# Coverage détaillé
npm run test:coverage
```

## 🛠️ Configuration

### Personnaliser les couleurs

Modifier `src/modules/config.js` :

```javascript
export const CONFIG = {
  COLORS: {
    primary: '#f29b9b',    // Rose doux
    secondary: '#493f3c',  // Brun foncé
    // ...
  }
};
```

### Changer l'URL de l'API

```javascript
export const CONFIG = {
  API_URL: 'https://votre-api.com/webhook/chat'
};
```

## 🌐 Intégration

### Kajabi

Ajouter dans **Site Settings** → **Custom Code** → **Footer** :

```html
<script src="https://chat.lagencedescopines.com/widget.js"></script>
```

### Autre site

```html
<script src="URL_DU_WIDGET/dist/widget.iife.js"></script>
```

Le widget s'auto-injecte automatiquement.

## 🐛 Debug

Activer les logs dans la console :

```javascript
localStorage.setItem('lac_debug', 'true');
location.reload();
```

Désactiver :

```javascript
localStorage.removeItem('lac_debug');
```

## 📊 Performance

| Métrique | Valeur |
|----------|--------|
| Bundle size | 17.76 KB |
| Gzipped | 5.44 KB |
| Modules | 8 |
| Dependencies | 0 (production) |

## 🔐 Sécurité

- **Shadow DOM** : Isolation CSS/JS complète
- **XSS Protection** : Échappement HTML systématique
- **No Dependencies** : Zéro dépendance runtime
- **Cache TTL** : 5 minutes max

## 🗺️ Roadmap

### Court terme
- [ ] Fixer les 3 tests API skippés
- [ ] Ajouter JSDoc complète
- [ ] Ajouter bouton "Nouvelle conversation"

### Moyen terme
- [ ] WebSocket pour temps réel
- [ ] Analytics anonymes
- [ ] Système de feedback (👍/👎)

### Long terme
- [ ] i18n (internationalisation)
- [ ] Thèmes personnalisables
- [ ] Plugins/extensions

## 📄 Scripts disponibles

```bash
npm run dev          # Dev server avec HMR
npm run build        # Build production
npm run preview      # Preview du build
npm test             # Tests en watch mode
npm run test:ui      # Interface tests
npm run test:once    # Tests une fois (CI)
npm run test:coverage # Coverage report
```

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Coder + tests
3. Vérifier : `npm run test:once && npm run build`
4. Commit : `git commit -m "feat: ma feature"`
5. Push et PR

## 📝 Licence

Propriétaire - L'Agence des Copines

---

**Version:** 2.0.0 (Modular)
**Build:** Vite 5.x
**Tests:** Vitest 1.x
**Auteur:** Benoit (CTO)
**Date:** 2025-11-05
