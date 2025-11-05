"""
RAG (Retrieval Augmented Generation) service with dual agent knowledge bases
"""
import logging
from typing import List, Dict, Any, Literal
import httpx
from openai import AsyncOpenAI
import cohere

from config.settings import settings

logger = logging.getLogger(__name__)

AgentType = Literal["audrey", "carole"]


class RAGService:
    """Service for RAG operations with separate knowledge bases per agent"""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.cohere_client = cohere.AsyncClient(api_key=settings.cohere_api_key)
        self.supabase_url = settings.supabase_url
        self.supabase_key = settings.supabase_key

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text using OpenAI

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = await self.openai_client.embeddings.create(
                model=settings.embedding_model,
                input=text,
            )
            return response.data[0].embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise

    async def vector_search(
        self,
        query_embedding: List[float],
        agent: AgentType,
        match_threshold: float = None,
        match_count: int = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search in Supabase filtered by agent

        Args:
            query_embedding: Query vector
            agent: Which agent's knowledge base to search ('audrey' or 'carole')
            match_threshold: Minimum similarity score (0-1)
            match_count: Number of results to return

        Returns:
            List of matching document chunks with metadata
        """
        threshold = match_threshold or settings.rag_similarity_threshold
        count = match_count or settings.rag_initial_results

        # Determine which Supabase function to call based on agent
        function_name = f"match_documents_{agent}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/rpc/{function_name}",
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "query_embedding": query_embedding,
                        "match_threshold": threshold,
                        "match_count": count,
                        "agent_filter": agent,
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"Supabase vector search failed: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Vector search error: {str(e)}")
            raise

    async def rerank_documents(
        self,
        query: str,
        documents: List[str],
        top_n: int = None,
    ) -> List[Dict[str, Any]]:
        """
        Rerank documents using Cohere's multilingual reranker

        Args:
            query: Original query text
            documents: List of document texts to rerank
            top_n: Number of top results to return

        Returns:
            List of reranked documents with scores
        """
        top_n = top_n or settings.rag_rerank_top_n

        try:
            response = await self.cohere_client.rerank(
                model=settings.rerank_model,
                query=query,
                documents=documents,
                top_n=top_n,
            )

            # Format results
            reranked = []
            for result in response.results:
                reranked.append({
                    "text": documents[result.index],
                    "score": result.relevance_score,
                    "index": result.index,
                })

            return reranked

        except Exception as e:
            logger.error(f"Reranking failed: {str(e)}")
            # Fallback: return top N documents without reranking
            logger.warning("Falling back to non-reranked results")
            return [
                {"text": doc, "score": 1.0 - (i * 0.1), "index": i}
                for i, doc in enumerate(documents[:top_n])
            ]

    async def rag_audrey(self, query: str) -> str:
        """
        Complete RAG pipeline for Audrey's knowledge base

        Args:
            query: User's query text

        Returns:
            Formatted context string for Audrey
        """
        logger.info(f"Running RAG pipeline for Audrey with query: {query[:100]}...")

        try:
            # Step 1: Generate embedding
            embedding = await self.generate_embedding(query)

            # Step 2: Vector search filtered for Audrey
            chunks = await self.vector_search(
                query_embedding=embedding,
                agent="audrey",
            )

            if not chunks:
                logger.warning("No relevant documents found for Audrey")
                return "Pas de contexte spécifique trouvé dans la base de connaissances d'Audrey."

            # Step 3: Rerank with Cohere
            document_texts = [chunk["content"] for chunk in chunks]
            reranked = await self.rerank_documents(
                query=query,
                documents=document_texts,
            )

            # Step 4: Format context
            context_parts = []
            for i, result in enumerate(reranked, 1):
                # Find original chunk to get metadata
                original_chunk = chunks[result["index"]]
                context_parts.append(
                    f"📚 Source {i}: {original_chunk.get('filename', 'Document')}\n"
                    f"Pertinence: {result['score']:.2f}\n"
                    f"{result['text']}"
                )

            formatted_context = "\n\n---\n\n".join(context_parts)
            logger.info(f"RAG Audrey: Retrieved {len(reranked)} relevant chunks")

            return formatted_context

        except Exception as e:
            logger.error(f"RAG pipeline failed for Audrey: {str(e)}")
            return "Erreur lors de la récupération du contexte."

    async def rag_carole(self, query: str) -> str:
        """
        Complete RAG pipeline for Carole's knowledge base

        Args:
            query: User's query text

        Returns:
            Formatted context string for Carole
        """
        logger.info(f"Running RAG pipeline for Carole with query: {query[:100]}...")

        try:
            # Step 1: Generate embedding
            embedding = await self.generate_embedding(query)

            # Step 2: Vector search filtered for Carole
            chunks = await self.vector_search(
                query_embedding=embedding,
                agent="carole",
            )

            if not chunks:
                logger.warning("No relevant documents found for Carole")
                return "Pas de contexte spécifique trouvé dans la base de connaissances de Carole."

            # Step 3: Rerank with Cohere
            document_texts = [chunk["content"] for chunk in chunks]
            reranked = await self.rerank_documents(
                query=query,
                documents=document_texts,
            )

            # Step 4: Format context
            context_parts = []
            for i, result in enumerate(reranked, 1):
                # Find original chunk to get metadata
                original_chunk = chunks[result["index"]]
                context_parts.append(
                    f"🎨 Source {i}: {original_chunk.get('filename', 'Document')}\n"
                    f"Pertinence: {result['score']:.2f}\n"
                    f"{result['text']}"
                )

            formatted_context = "\n\n---\n\n".join(context_parts)
            logger.info(f"RAG Carole: Retrieved {len(reranked)} relevant chunks")

            return formatted_context

        except Exception as e:
            logger.error(f"RAG pipeline failed for Carole: {str(e)}")
            return "Erreur lors de la récupération du contexte."


# Singleton instance
rag_service = RAGService()
