"""
Chat API endpoints
"""
import logging
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status

from models.schemas import (
    ChatRequest,
    ChatResponse,
    RateLimitResponse,
    ErrorResponse,
)
from services.openrouter_client import openrouter_client
from services.rag_service import rag_service
from services.conversation_service import conversation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Main chat endpoint with intelligent agent routing and RAG

    Process:
    1. Rate limit check
    2. Load conversation history
    3. Orchestrator decides which agent
    4. Agent-specific RAG retrieval
    5. Generate response with context
    6. Save messages asynchronously

    Returns:
        ChatResponse with agent's message and metadata
    """
    try:
        # Step 1: Rate limit check
        rate_status = await conversation_service.check_rate_limit(request.conversation_id)
        if not rate_status["allowed"]:
            logger.warning(f"Rate limit exceeded for conversation {request.conversation_id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please wait before sending more messages. Remaining: {rate_status['remaining']}"
            )

        # Step 2: Ensure conversation exists
        await conversation_service.ensure_conversation_exists(
            conversation_id=request.conversation_id,
            user_id=request.user_id,
        )

        # Step 3: Load conversation history (async)
        history = await conversation_service.load_history(request.conversation_id)

        # Step 4: Orchestrator decides which agent
        logger.info(f"Processing message for conversation {request.conversation_id}")
        decision = await openrouter_client.orchestrate(
            user_message=request.message,
            history=history,
        )

        # Handle escalation
        if decision["agent"] == "escalate":
            logger.info(f"Message escalated (low confidence: {decision['confidence']})")
            response_text = (
                "Je ne suis pas sûre de bien comprendre votre besoin. "
                "Pourriez-vous reformuler ou préciser ce que vous recherchez ? "
                "Cela m'aidera à vous diriger vers la bonne experte (Audrey pour l'automatisation ou Carole pour la création de contenu)."
            )
            agent_used = "escalate"
            rag_context = ""

        else:
            # Step 5: Agent-specific RAG retrieval
            if decision["agent"] == "audrey":
                rag_context = await rag_service.rag_audrey(request.message)
                response_text = await openrouter_client.audrey_response(
                    user_message=request.message,
                    history=history,
                    rag_context=rag_context,
                )
                agent_used = "audrey"

            else:  # carole
                rag_context = await rag_service.rag_carole(request.message)
                response_text = await openrouter_client.carole_response(
                    user_message=request.message,
                    history=history,
                    rag_context=rag_context,
                )
                agent_used = "carole"

        # Step 6: Save messages (fire-and-forget async)
        asyncio.create_task(
            _save_conversation_messages(
                conversation_id=request.conversation_id,
                user_message=request.message,
                assistant_message=response_text,
                agent=agent_used,
            )
        )

        # Return response
        return ChatResponse(
            conversation_id=request.conversation_id,
            message=response_text,
            agent=agent_used,
            confidence=decision["confidence"],
            reasoning=decision["reasoning"],
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred processing your message: {str(e)}"
        )


async def _save_conversation_messages(
    conversation_id: str,
    user_message: str,
    assistant_message: str,
    agent: str,
) -> None:
    """
    Helper to save both user and assistant messages
    Runs asynchronously without blocking the response
    """
    try:
        # Save user message
        await conversation_service.save_message(
            conversation_id=conversation_id,
            role="user",
            content=user_message,
        )

        # Save assistant message
        await conversation_service.save_message(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_message,
            agent=agent,
        )

    except Exception as e:
        logger.error(f"Failed to save conversation messages: {str(e)}")


@router.get(
    "/rate-limit/{conversation_id}",
    response_model=RateLimitResponse,
)
async def check_rate_limit(conversation_id: str) -> RateLimitResponse:
    """
    Check rate limit status for a conversation

    Args:
        conversation_id: Conversation identifier

    Returns:
        RateLimitResponse with current limit status
    """
    try:
        status = await conversation_service.check_rate_limit(conversation_id)
        return RateLimitResponse(
            allowed=status["allowed"],
            remaining=status["remaining"],
        )

    except Exception as e:
        logger.error(f"Rate limit check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check rate limit"
        )
