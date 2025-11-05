"""
Configuration settings for L'Agence des Copines chatbot v2
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Supabase Configuration
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # OpenRouter Configuration
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # OpenAI Configuration (for embeddings)
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 1536

    # Cohere Configuration (for reranking)
    cohere_api_key: str = os.getenv("COHERE_API_KEY", "")
    rerank_model: str = "rerank-multilingual-v3.0"

    # Model Configuration
    orchestrator_model: str = "anthropic/claude-3-haiku"
    audrey_model: str = "anthropic/claude-3.5-sonnet"
    carole_model: str = "anthropic/claude-3.5-sonnet"
    fallback_model: str = "openai/gpt-4o-mini"

    # RAG Configuration
    rag_similarity_threshold: float = 0.7
    rag_initial_results: int = 20
    rag_rerank_top_n: int = 3

    # Conversation Configuration
    max_history_messages: int = 10
    rate_limit_messages: int = 10
    rate_limit_window_seconds: int = 60

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list = ["*"]

    # Temperature Settings
    orchestrator_temperature: float = 0.3
    agent_temperature: float = 0.7

    # Token Limits
    orchestrator_max_tokens: int = 200
    agent_max_tokens: int = 1000

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
