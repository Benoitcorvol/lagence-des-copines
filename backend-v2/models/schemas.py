"""
Pydantic models for API request/response schemas
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""

    user_id: str = Field(..., description="Unique user identifier")
    conversation_id: str = Field(..., description="Conversation identifier")
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp")


class OrchestrationDecision(BaseModel):
    """Orchestrator decision model"""

    agent: Literal["audrey", "carole", "escalate"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    primary_need: str
    reasoning: str


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""

    conversation_id: str
    message: str = Field(..., description="Assistant response")
    agent: Literal["audrey", "carole", "escalate"]
    confidence: float
    reasoning: str
    timestamp: str


class RateLimitResponse(BaseModel):
    """Rate limit status response"""

    allowed: bool
    remaining: int
    limit: int = Field(default=10)
    window_seconds: int = Field(default=60)


class HealthResponse(BaseModel):
    """Health check response"""

    status: str
    timestamp: str
    services: dict


class ErrorResponse(BaseModel):
    """Error response model"""

    error: str
    detail: Optional[str] = None
    timestamp: str
