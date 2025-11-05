# Guide d'intégration Kajabi

Guide complet pour intégrer le widget de chat L'Agence des Copines sur votre site Kajabi.

## 🚀 Installation rapide (3 étapes)

### Étape 1 : Accéder aux paramètres du site

1. Connectez-vous à votre compte Kajabi
2. Allez dans **Site** → **Settings** (Paramètres)
3. Cliquez sur l'onglet **Custom Code** (Code personnalisé)

### Étape 2 : Ajouter le code d'intégration

Dans la section **Footer Code** (Code de pied de page), ajoutez ce code :

```html
<script src="https://chat.lagencedescopines.com/widget.js" async></script>
```

**Important :** Utilisez bien la section **Footer** (pied de page), pas Header.

### Étape 3 : Publier les modifications

1. Cliquez sur **Save** (Enregistrer)
2. Attendez quelques secondes que Kajabi recompile votre site
3. Rafraîchissez votre page Kajabi → Le bouton rose devrait apparaître en bas à droite ! 🎉

---

## ✅ Vérification de l'installation

### Le widget fonctionne si :

- [x] Un bouton rose (60x60px) apparaît en bas à droite
- [x] Le bouton affiche une icône de bulle de chat
- [x] Cliquer dessus ouvre une fenêtre de chat (400x600px sur desktop)
- [x] La fenêtre affiche "L'Agence des Copines" en en-tête
- [x] Un message de bienvenue s'affiche automatiquement
- [x] Vous pouvez taper et envoyer des messages

### En cas de problème :

**Le bouton n'apparaît pas ?**
- Vérifiez que le code est bien dans **Footer Code**
- Attendez 2-3 minutes que Kajabi compile
- Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
- Vérifiez la console DevTools (F12) pour les erreurs

**Le widget s'affiche mal ?**
- Le Shadow DOM empêche normalement tout conflit CSS
- Si le problème persiste, contactez le support technique

---

## 🎨 Personnalisation (optionnel)

### Couleurs de la marque

Le widget utilise automatiquement les couleurs de L'Agence des Copines :

- **Rose principal** : `#f29b9b`
- **Brun foncé** : `#493f3c`
- **Gris clair** : `#f7f7f8`

Ces couleurs sont configurées dans le widget et ne nécessitent aucun changement.

### Message de bienvenue

Le widget affiche aléatoirement l'un de ces messages au premier chargement :

- "Salut ! Je suis l'assistante des Copines. Comment puis-je t'aider aujourd'hui ? 💕"
- "Coucou ! Besoin d'un coup de main ? Je suis là pour toi ! 🌸"
- "Hello ! Pose-moi toutes tes questions, je suis là pour t'accompagner ! ✨"

**Pour personnaliser les messages**, il faudra modifier le fichier source `widget.js` (contactez le développeur).

---

## 📱 Comportement responsive

### Desktop (écran ≥ 768px)

- Popup de chat : **400x600px**
- Position : **bas à droite** (20px de marge)
- Animation : **slide-up** (glissement vers le haut)

### Mobile (écran < 768px)

- Mode : **Plein écran** (100% de la hauteur/largeur)
- Bouton : reste en **bas à droite**
- Clavier : le chat s'adapte automatiquement

**Testez sur plusieurs appareils :**
- iPhone (Safari)
- Android (Chrome)
- iPad (mode portrait et paysage)

---

## 🔒 Sécurité et confidentialité

### Protection intégrée

- **Shadow DOM** : Isolation complète CSS/JS (aucun conflit avec Kajabi)
- **XSS Prevention** : Tous les messages utilisateurs sont échappés (escapeHtml)
- **CORS** : Headers configurés pour accepter uniquement les requêtes de Kajabi
- **Rate Limiting** : 10 messages maximum par minute par utilisateur

### Données collectées

Le widget collecte uniquement :

- **User ID** : UUID anonyme généré localement (pas d'email)
- **Messages** : Conversation entre l'utilisateur et le bot
- **Timestamps** : Horodatage des messages

**Aucune donnée personnelle (email, nom, téléphone) n'est collectée** sauf si l'utilisateur la partage volontairement dans le chat.

### localStorage

Le widget utilise `localStorage` pour :

- `lac_user_id` : Identifiant anonyme de l'utilisateur
- `lac_conversation_id` : ID de la conversation en cours
- `lac_messages_cache` : Cache des messages (5 minutes)
- `lac_cache_timestamp` : Date du dernier cache

**Ces données sont stockées localement dans le navigateur** et ne sont jamais partagées avec des tiers.

---

## 🧪 Mode Debug

### Activer le mode debug

Pour voir les logs détaillés du widget dans la console du navigateur :

1. Ouvrez la console DevTools (F12)
2. Tapez cette commande :

```javascript
localStorage.setItem('lac_debug', 'true');
location.reload();
```

3. Rafraîchissez la page
4. Vous verrez maintenant tous les logs préfixés `[LAC Widget]`

### Désactiver le mode debug

```javascript
localStorage.removeItem('lac_debug');
location.reload();
```

### Logs utiles

Le mode debug affiche :
- Création des UUIDs (user, conversation)
- Chargement du cache
- Envoi de messages
- Réponses de l'API
- Erreurs réseau

---

## 📊 Monitoring et analytics

### Vérifier que le widget fonctionne

Ouvrez la console DevTools (F12) et tapez :

```javascript
// Vérifier l'existence du widget
document.querySelector('lac-chat-widget');

// Vérifier le Shadow DOM
document.querySelector('lac-chat-widget').shadowRoot;

// Vérifier l'User ID
localStorage.getItem('lac_user_id');

// Vérifier le cache de messages
JSON.parse(localStorage.getItem('lac_messages_cache'));
```

### Mesurer la performance

Le widget est optimisé pour :

- **Temps de chargement** : < 2 secondes
- **Taille du bundle** : 5.21 KB gzippé
- **Temps de réponse** : < 10 secondes (incluant l'API backend)

---

## ❓ FAQ

### Le widget ralentit-il mon site Kajabi ?

**Non.** Le widget ne pèse que 5.21 KB gzippé et se charge de manière asynchrone (`async`), ce qui signifie qu'il ne bloque pas le chargement de votre page.

### Puis-je masquer le widget sur certaines pages ?

**Oui.** Vous pouvez ajouter du code JavaScript personnalisé pour masquer le widget sur certaines pages. Exemple :

```html
<script>
// Masquer le widget sur la page "à propos"
if (window.location.pathname === '/about') {
  document.addEventListener('DOMContentLoaded', function() {
    const widget = document.querySelector('lac-chat-widget');
    if (widget) widget.style.display = 'none';
  });
}
</script>
```

### Le widget fonctionne-t-il avec mon thème Kajabi ?

**Oui.** Le widget utilise le Shadow DOM pour garantir une isolation complète. Il fonctionnera avec tous les thèmes Kajabi sans conflit CSS.

### Puis-je changer la position du bouton ?

**Actuellement, le bouton est fixé en bas à droite.** Pour changer la position, il faudrait modifier le code source (contactez le développeur).

### Les conversations sont-elles sauvegardées ?

**Oui.** Les conversations sont :
1. Stockées dans `localStorage` (cache local de 5 minutes)
2. Persistées dans la base de données Supabase (backend)

Si un utilisateur efface son cache navigateur, il perdra sa conversation locale, mais vous pourrez toujours la consulter côté backend.

### Combien d'utilisateurs simultanés le widget peut-il supporter ?

Le système est conçu pour gérer **50 utilisateurs simultanés** avec un temps de réponse < 10 secondes.

---

## 🔧 Dépannage avancé

### Problème : Le widget ne communique pas avec le backend

**Symptômes** :
- Messages envoyés mais aucune réponse
- Indicateur de frappe (typing dots) qui ne disparaît jamais

**Solution** :
1. Vérifiez que le backend n8n est en ligne : `https://chat.lagencedescopines.com/health`
2. Vérifiez les logs dans la console (mode debug activé)
3. Vérifiez que le domaine Kajabi est autorisé dans les headers CORS

### Problème : Erreur CORS

**Symptômes** :
- Console affiche "CORS policy blocked"

**Solution** :
Le fichier `nginx.conf` doit inclure :

```nginx
add_header Access-Control-Allow-Origin "https://votre-site.kajabi.com";
```

Contactez le développeur pour ajouter votre domaine.

### Problème : Messages trop longs bloqués

**Symptômes** :
- Le bouton "Envoyer" est désactivé
- Le compteur de caractères est rouge

**Solution** :
La limite est de **2000 caractères par message**. Demandez à l'utilisateur de raccourcir son message.

---

## 📞 Support technique

**Développeur** : Benoit (CTO L'Agence des Copines)

**Pour toute question :**
1. Vérifiez d'abord cette documentation
2. Activez le mode debug et relevez les erreurs
3. Contactez le support avec une capture d'écran de la console

---

## 📋 Checklist de déploiement

Avant de considérer l'intégration comme complète :

- [ ] Le widget apparaît sur toutes les pages Kajabi
- [ ] Le widget fonctionne sur desktop ET mobile
- [ ] Les messages s'envoient et reçoivent des réponses
- [ ] Le cache localStorage fonctionne (test de rafraîchissement de page)
- [ ] Aucune erreur dans la console DevTools
- [ ] Le bouton ne bloque pas d'éléments importants de la page
- [ ] Le widget fonctionne sur Chrome, Firefox, Safari, Edge
- [ ] Les conversations sont sauvegardées dans Supabase
- [ ] Le mode debug peut être activé/désactivé

---

**Version du widget** : 1.0.0
**Date de création** : 2025-11-03
**Dernière mise à jour** : 2025-11-03
