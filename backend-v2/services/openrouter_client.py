"""
OpenRouter client for LLM calls with automatic fallback support
"""
import json
import logging
from typing import List, Dict, Any, Optional
import httpx

from config.settings import settings

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Client for OpenRouter API with fallback logic"""

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.models = {
            "orchestrator": settings.orchestrator_model,
            "audrey": settings.audrey_model,
            "carole": settings.carole_model,
            "fallback": settings.fallback_model,
        }
        self.timeout = httpx.Timeout(60.0, connect=10.0)

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        use_fallback: bool = True,
    ) -> Dict[str, Any]:
        """
        Make chat completion request to OpenRouter

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model identifier (e.g., 'anthropic/claude-3.5-sonnet')
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            use_fallback: Whether to use fallback model on error

        Returns:
            Response dict with 'choices' containing generated text
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://lagencedescopines.com",
            "X-Title": "L'Agence des Copines Chatbot v2",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter API error with {model}: {e.response.status_code} - {e.response.text}")

            # Retry with fallback model if enabled and error is server-side
            if use_fallback and e.response.status_code >= 500 and model != self.models["fallback"]:
                logger.info(f"Retrying with fallback model: {self.models['fallback']}")
                return await self.chat_completion(
                    messages=messages,
                    model=self.models["fallback"],
                    temperature=temperature,
                    max_tokens=max_tokens,
                    use_fallback=False,  # Prevent infinite recursion
                )
            raise

        except httpx.RequestError as e:
            logger.error(f"Network error calling OpenRouter: {str(e)}")
            raise

    async def orchestrate(self, user_message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Use orchestrator model to decide which agent should respond

        Args:
            user_message: Current user message
            history: Recent conversation history

        Returns:
            Decision dict with 'agent', 'confidence', 'primary_need', 'reasoning'
        """
        system_prompt = """Tu es l'orchestrateur intelligent pour L'Agence des Copines.
Tu analyses la demande de l'utilisateur et décides qui est le mieux placé pour répondre.

👩‍💼 AUDREY - Experte Automation & Tunnels de Vente:
- Funnels de vente et automatisation marketing
- Email marketing et séquences automatisées
- Outils techniques: Kajabi, Zapier, ActiveCampaign, Systeme.io
- Stratégies de conversion et optimisation
- Analytics, tracking, et métriques de performance

🎨 CAROLE - Experte Création & Instagram:
- Stratégie Instagram (reels, stories, posts, carrousels)
- Création de contenu engageant et viral
- Storytelling et copywriting authentique
- Branding et identité visuelle cohérente
- Community management et engagement
- Design et esthétique

ANALYSE:
1. Lis le message de l'utilisateur
2. Regarde l'historique de conversation pour contexte
3. Identifie le besoin principal

DÉCISION:
Retourne UNIQUEMENT un JSON strictement formaté (pas de texte avant ou après):
{
  "agent": "audrey" | "carole" | "escalate",
  "confidence": 0.0-1.0,
  "primary_need": "description courte du besoin principal",
  "reasoning": "explication de ta décision en 1 phrase"
}

Si incertain (confidence < 0.7), choisis "escalate"."""

        # Format history for context
        history_text = "\n".join([
            f"{msg['role']}: {msg['content'][:100]}..."
            for msg in history[-5:]  # Last 5 messages for context
        ]) if history else "Pas d'historique"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"MESSAGE UTILISATEUR: {user_message}\n\nHISTORIQUE RÉCENT:\n{history_text}"}
        ]

        response = await self.chat_completion(
            messages=messages,
            model=self.models["orchestrator"],
            temperature=settings.orchestrator_temperature,
            max_tokens=settings.orchestrator_max_tokens,
        )

        # Parse JSON response
        content = response["choices"][0]["message"]["content"]
        try:
            decision = json.loads(content)
            logger.info(f"Orchestrator decision: {decision['agent']} (confidence: {decision['confidence']})")
            return decision
        except json.JSONDecodeError:
            logger.error(f"Failed to parse orchestrator response as JSON: {content}")
            # Fallback decision
            return {
                "agent": "escalate",
                "confidence": 0.0,
                "primary_need": "parsing error",
                "reasoning": "Impossible de parser la réponse de l'orchestrateur"
            }

    async def audrey_response(
        self,
        user_message: str,
        history: List[Dict[str, str]],
        rag_context: str
    ) -> str:
        """
        Generate response from Audrey (Automation expert)

        Args:
            user_message: Current user message
            history: Recent conversation history
            rag_context: Retrieved context from Audrey's knowledge base

        Returns:
            Audrey's response text
        """
        system_prompt = f"""Tu es Audrey, experte en automatisation marketing et tunnels de vente pour L'Agence des Copines.

TA PERSONNALITÉ:
- Structurée, claire, et pédagogue
- Tu simplifies le technique pour les non-techniques
- Tu donnes des étapes concrètes à suivre
- Tu utilises des métaphores simples pour expliquer
- Ton style: professionnel mais chaleureux et accessible

TON EXPERTISE:
- Tunnels de vente (funnels) et automatisation marketing
- Email marketing et séquences automatisées
- Outils techniques: Kajabi, Zapier, ActiveCampaign, Systeme.io
- Systèmes de conversion et optimisation
- Analytics, tracking, et métriques de performance
- Automatisation de processus marketing

CONTEXTE UTILISATEUR:
- Professionnels du bien-être (coachs, thérapeutes, praticiens)
- Solopreneurs qui veulent automatiser leur acquisition clients
- Souvent novices en technique
- Veulent des processus clairs step-by-step

TON RÔLE:
1. Décompose les problèmes techniques en étapes simples
2. Explique le "pourquoi" avant le "comment"
3. Donne des templates et frameworks actionnables
4. Rassure sur la faisabilité technique
5. Propose des quick wins rapides à implémenter

RESSOURCES DISPONIBLES (BASE DE CONNAISSANCES):
{rag_context}

RÉPONDS EN FRANÇAIS avec le ton d'Audrey. Maximum 250 mots. Sois pratique et actionnable."""

        messages = [{"role": "system", "content": system_prompt}]

        # Add history
        messages.extend(history[-settings.max_history_messages:])

        # Add current message
        messages.append({"role": "user", "content": user_message})

        response = await self.chat_completion(
            messages=messages,
            model=self.models["audrey"],
            temperature=settings.agent_temperature,
            max_tokens=settings.agent_max_tokens,
        )

        return response["choices"][0]["message"]["content"]

    async def carole_response(
        self,
        user_message: str,
        history: List[Dict[str, str]],
        rag_context: str
    ) -> str:
        """
        Generate response from Carole (Creation expert)

        Args:
            user_message: Current user message
            history: Recent conversation history
            rag_context: Retrieved context from Carole's knowledge base

        Returns:
            Carole's response text
        """
        system_prompt = f"""Tu es Carole, experte en création de contenu Instagram pour L'Agence des Copines.

TA PERSONNALITÉ:
- Créative, inspirante, et chaleureuse
- Tu parles avec enthousiasme de stratégie de contenu
- Tu utilises des emojis naturellement (🎨✨📸💡)
- Tu donnes des exemples concrets et visuels
- Ton style: friendly, motivant, et énergisant

TON EXPERTISE:
- Stratégie Instagram (reels, stories, posts, carrousels)
- Création de contenu engageant et viral
- Storytelling authentique et captivant
- Branding et cohérence visuelle
- Planification éditoriale et calendrier de contenu
- Hooks et copywriting accrocheurs
- Community management et engagement

CONTEXTE UTILISATEUR:
- Professionnels du bien-être (coachs, thérapeutes, praticiens)
- Solopreneurs qui veulent développer leur présence Instagram
- Besoin de créer du contenu régulier et impactant
- Veulent se démarquer avec authenticité

TON RÔLE:
1. Comprends le besoin créatif spécifique
2. Donne des conseils actionnables immédiatement
3. Propose des idées créatives et exemples concrets
4. Encourage et motive avec enthousiasme
5. Inspire à passer à l'action avec confiance

RESSOURCES DISPONIBLES (BASE DE CONNAISSANCES):
{rag_context}

RÉPONDS EN FRANÇAIS avec le ton de Carole. Maximum 250 mots. Sois inspirante et créative! ✨"""

        messages = [{"role": "system", "content": system_prompt}]

        # Add history
        messages.extend(history[-settings.max_history_messages:])

        # Add current message
        messages.append({"role": "user", "content": user_message})

        response = await self.chat_completion(
            messages=messages,
            model=self.models["carole"],
            temperature=settings.agent_temperature,
            max_tokens=settings.agent_max_tokens,
        )

        return response["choices"][0]["message"]["content"]


# Singleton instance
openrouter_client = OpenRouterClient()
