/**
 * Configuration constants for L'Agence des Copines Chat Widget
 * @module config
 */

export const CONFIG = {
  API_URL: 'https://chat.lagencedescopines.com/webhook/chat',
  COLORS: {
    primary: '#f29b9b',      // Rose doux (brand color)
    secondary: '#493f3c',    // Brun foncé (brand color)
    background: '#f7f7f8',   // Gris clair
    text: '#333333',
    white: '#ffffff',
    error: '#ff9800'
  },
  BORDER_RADIUS: '15px',
  CACHE_DURATION: 5 * 60 * 1000,  // 5 minutes in milliseconds
  MAX_RETRY: 1,
  TIMEOUT: 15000,  // 15 seconds in milliseconds
  MAX_MESSAGE_LENGTH: 2000
};

/**
 * Error messages in French for user display
 * @type {Object.<string, string>}
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Oups, problème de connexion. Peux-tu réessayer ?",
  RATE_LIMIT: "Tu as envoyé beaucoup de messages ! Attends quelques instants.",
  SERVICE_ERROR: "Désolée, je rencontre un petit souci technique. Réessaie dans un instant !",
  TIMEOUT: "La réponse prend un peu de temps... Peux-tu renvoyer ton message ?",
  INVALID_MESSAGE: "Oups, ton message semble vide. Écris-moi quelque chose !"
};

/**
 * Welcome messages (randomly selected)
 * @type {string[]}
 */
export const WELCOME_MESSAGES = [
  "Salut ! Je suis l'assistante des Copines. Comment puis-je t'aider aujourd'hui ? 💕",
  "Coucou ! Besoin d'un coup de main ? Je suis là pour toi ! 🌸",
  "Hello ! Pose-moi toutes tes questions, je suis là pour t'accompagner ! ✨"
];
