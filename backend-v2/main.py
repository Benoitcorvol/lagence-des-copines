"""
FastAPI main application for L'Agence des Copines chatbot v2
"""
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import settings
from models.schemas import HealthResponse
from api.chat import router as chat_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="L'Agence des Copines Chatbot v2",
    description="Intelligent dual-agent chatbot with RAG for L'Agence des Copines",
    version="2.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint

    Returns:
        HealthResponse with service status
    """
    services = {
        "supabase": bool(settings.supabase_url and settings.supabase_key),
        "openrouter": bool(settings.openrouter_api_key),
        "openai": bool(settings.openai_api_key),
        "cohere": bool(settings.cohere_api_key),
    }

    all_healthy = all(services.values())

    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        timestamp=datetime.now(timezone.utc).isoformat(),
        services=services,
    )


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "L'Agence des Copines Chatbot v2",
        "version": "2.0.0",
        "description": "Intelligent dual-agent chatbot with RAG",
        "agents": {
            "audrey": "Expert en automatisation marketing et tunnels de vente",
            "carole": "Expert en création de contenu Instagram",
        },
        "endpoints": {
            "health": "/health",
            "chat": "/api/chat",
            "rate_limit": "/api/rate-limit/{conversation_id}",
            "docs": "/docs",
        },
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting L'Agence des Copines chatbot v2 on {settings.api_host}:{settings.api_port}")
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level="info",
    )
