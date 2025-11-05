"""
Conversation service for managing chat history and messages in Supabase
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx

from config.settings import settings

logger = logging.getLogger(__name__)


class ConversationService:
    """Service for conversation and message management"""

    def __init__(self):
        self.supabase_url = settings.supabase_url
        self.supabase_key = settings.supabase_key

    async def load_history(
        self,
        conversation_id: str,
        limit: int = None
    ) -> List[Dict[str, str]]:
        """
        Load recent conversation history from Supabase

        Args:
            conversation_id: Conversation identifier
            limit: Maximum number of messages to retrieve

        Returns:
            List of messages in chronological order with 'role' and 'content'
        """
        limit = limit or settings.max_history_messages

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/rest/v1/messages",
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}",
                    },
                    params={
                        "conversation_id": f"eq.{conversation_id}",
                        "order": "created_at.desc",
                        "limit": limit,
                    },
                    timeout=10.0,
                )
                response.raise_for_status()
                messages = response.json()

                # Reverse to get chronological order
                messages.reverse()

                # Format for LLM
                formatted = []
                for msg in messages:
                    formatted.append({
                        "role": msg["role"],  # 'user' or 'assistant'
                        "content": msg["content"]
                    })

                logger.info(f"Loaded {len(formatted)} messages for conversation {conversation_id}")
                return formatted

        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to load history: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            logger.error(f"Error loading conversation history: {str(e)}")
            return []

    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        agent: Optional[str] = None,
    ) -> bool:
        """
        Save a message to Supabase

        Args:
            conversation_id: Conversation identifier
            role: Message role ('user' or 'assistant')
            content: Message content
            agent: Which agent responded (for assistant messages)

        Returns:
            True if successful, False otherwise
        """
        try:
            message_data = {
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

            if agent:
                message_data["agent"] = agent

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/messages",
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal",
                    },
                    json=message_data,
                    timeout=10.0,
                )
                response.raise_for_status()
                logger.info(f"Saved {role} message to conversation {conversation_id}")
                return True

        except Exception as e:
            logger.error(f"Failed to save message: {str(e)}")
            return False

    async def ensure_conversation_exists(
        self,
        conversation_id: str,
        user_id: str,
    ) -> bool:
        """
        Ensure conversation exists in database, create if needed

        Args:
            conversation_id: Conversation identifier
            user_id: User identifier

        Returns:
            True if conversation exists or was created successfully
        """
        try:
            # Try to get existing conversation
            async with httpx.AsyncClient() as client:
                get_response = await client.get(
                    f"{self.supabase_url}/rest/v1/conversations",
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}",
                    },
                    params={"id": f"eq.{conversation_id}"},
                    timeout=10.0,
                )

                if get_response.status_code == 200 and get_response.json():
                    logger.info(f"Conversation {conversation_id} already exists")
                    return True

                # Create new conversation
                conversation_data = {
                    "id": conversation_id,
                    "user_id": user_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }

                create_response = await client.post(
                    f"{self.supabase_url}/rest/v1/conversations",
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal",
                    },
                    json=conversation_data,
                    timeout=10.0,
                )
                create_response.raise_for_status()
                logger.info(f"Created new conversation {conversation_id}")
                return True

        except Exception as e:
            logger.error(f"Error ensuring conversation exists: {str(e)}")
            return False

    async def check_rate_limit(
        self,
        conversation_id: str,
    ) -> Dict[str, Any]:
        """
        Check if conversation is within rate limits

        Args:
            conversation_id: Conversation identifier

        Returns:
            Dict with 'allowed' (bool) and 'remaining' (int) keys
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/rpc/check_rate_limit",
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "p_conversation_id": conversation_id,
                        "p_max_messages": settings.rate_limit_messages,
                        "p_window_seconds": settings.rate_limit_window_seconds,
                    },
                    timeout=10.0,
                )
                response.raise_for_status()
                result = response.json()

                return {
                    "allowed": result.get("allowed", True),
                    "remaining": result.get("remaining", settings.rate_limit_messages),
                }

        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            # Fail open - allow the request
            return {"allowed": True, "remaining": settings.rate_limit_messages}


# Singleton instance
conversation_service = ConversationService()
