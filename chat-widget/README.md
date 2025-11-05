# L'Agence des Copines - Chat Widget

Widget de chat IA pour L'Agence des Copines, avec système dual-agent (Création/Automation) et base de connaissances RAG.

## 🚀 Quick Start

### Installation des dépendances

```bash
npm install
```

### Développement local

```bash
# Ouvrir la page de test dans le navigateur
open test/test.html

# OU démarrer un serveur local
python3 -m http.server 8000
# Puis ouvrir http://localhost:8000/test/test.html
```

### Build pour production

```bash
# Build minifié avec source map
npm run build

# OU utiliser le script bash directement
./build.sh
```

Les fichiers de production seront dans `dist/` :
- `widget.min.js` - Bundle minifié (<50KB gzipped)
- `widget.js.map` - Source map pour debugging

## 📦 Structure du projet

```
chat-widget/
├── src/
│   └── widget.js          # Code source principal
├── dist/
│   ├── widget.min.js      # Bundle production (généré)
│   └── widget.js.map      # Source map (généré)
├── test/
│   └── test.html          # Page de test locale
├── package.json           # Configuration npm
├── build.sh               # Script de build
└── README.md              # Ce fichier
```

## 🧪 Testing

### Test local

1. Ouvrir `test/test.html` dans un navigateur
2. Vérifier que le bouton rose apparaît en bas à droite
3. Cliquer pour ouvrir le chat (popup 400x600px sur desktop)
4. Tester le bouton de fermeture et la touche Escape

### Debug mode

Pour activer les logs de debug dans la console :

```javascript
localStorage.setItem('lac_debug', 'true');
location.reload();
```

Pour désactiver :

```javascript
localStorage.removeItem('lac_debug');
location.reload();
```

### Vérifier localStorage

```javascript
// User ID (généré automatiquement)
localStorage.getItem('lac_user_id');

// Conversation ID
localStorage.getItem('lac_conversation_id');

// Effacer toutes les données
localStorage.clear();
```

## 🎨 Configuration

Les couleurs et styles de la marque sont dans `src/widget.js` :

```javascript
const CONFIG = {
  COLORS: {
    primary: '#f29b9b',      // Rose doux (brand)
    secondary: '#493f3c',    // Brun foncé (brand)
    background: '#f7f7f8',   // Gris clair
    text: '#333333',
    white: '#ffffff'
  },
  BORDER_RADIUS: '15px',
  API_URL: 'https://chat.lagencedescopines.com/webhook/chat'
};
```

## 🌐 Intégration Kajabi

### Ajouter le widget à votre site Kajabi

1. Aller dans **Site Settings** → **Custom Code** → **Footer**
2. Ajouter ce code :

```html
<script src="https://chat.lagencedescopines.com/widget.js" async></script>
```

3. Sauvegarder et publier

Le widget s'injectera automatiquement sur toutes les pages.

### Responsive Design

- **Desktop (≥768px)** : Popup 400x600px en bas à droite
- **Mobile (<768px)** : Mode plein écran (100vh)

## 📋 Checklist - Story 2.1

- [x] Shadow DOM pour isolation CSS
- [x] Web Component `<lac-chat-widget>`
- [x] Auto-injection sur DOMContentLoaded
- [x] Bouton flottant (60x60px, rose)
- [x] Popup chat avec header/messages/input
- [x] Bouton de fermeture + touche Escape
- [x] Génération UUID utilisateur
- [x] Debug logging
- [x] Accessibilité (ARIA labels, focus)
- [x] Responsive mobile

## 🔧 Développement

### Stories Epic 2

- [x] **Story 2.1** : Widget Foundation with Shadow DOM ✅
- [ ] **Story 2.2** : Implement Floating Button UI (déjà inclus dans 2.1)
- [ ] **Story 2.3** : Build Desktop Chat Popup (déjà inclus dans 2.1)
- [ ] **Story 2.4** : Implement Mobile Fullscreen Mode
- [ ] **Story 2.5** : Implement Message Send/Receive UI
- [ ] **Story 2.6** : Add Typing Indicator Animation
- [ ] **Story 2.7** : Implement localStorage Persistence
- [ ] **Story 2.8** : Implement Error Handling UI
- [ ] **Story 2.9** : Implement API Communication to n8n
- [ ] **Story 2.10** : Build and Deploy Production Widget
- [ ] **Story 2.11** : Create Kajabi Integration Script

### Prochaines étapes

1. Tester le widget actuel dans `test/test.html`
2. Ajouter l'envoi de messages (Story 2.5)
3. Intégrer avec le backend n8n (Story 2.9)
4. Déployer sur le VPS

## 📊 Performance

**Objectifs :**
- Bundle size : <50KB gzipped ✅
- Load time : <2 secondes
- Pas de conflits CSS avec Kajabi

**Vérifier la taille :**

```bash
./build.sh
# Affiche la taille minifiée et gzippée
```

## 🔒 Sécurité

- **Shadow DOM** : Isolation complète CSS/JS
- **CORS** : Headers configurés pour Kajabi uniquement
- **XSS Prevention** : Validation des inputs
- **Rate Limiting** : 10 messages/minute (backend)

## 📝 Licence

Propriétaire - L'Agence des Copines

---

**Version:** 1.0.0
**Auteur:** Benoit (CTO)
**Date:** 2025-11-03
