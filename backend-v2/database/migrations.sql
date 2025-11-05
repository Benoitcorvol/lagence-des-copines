-- Database migrations for L'Agence des Copines chatbot v2
-- Execute these in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Extend documents table for agent-specific ownership
-- ============================================================================

-- Add new columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS agent_owner TEXT CHECK (agent_owner IN ('audrey', 'carole', 'shared')),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Create index for fast agent filtering
CREATE INDEX IF NOT EXISTS idx_documents_agent ON documents(agent_owner);

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- ============================================================================
-- STEP 2: Create Supabase function for Audrey's vector search
-- ============================================================================

CREATE OR REPLACE FUNCTION match_documents_audrey(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  agent_filter text DEFAULT 'audrey'
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  filename text,
  agent_owner text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.filename,
    d.agent_owner
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (d.agent_owner = agent_filter OR d.agent_owner = 'shared')
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================================
-- STEP 3: Create Supabase function for Carole's vector search
-- ============================================================================

CREATE OR REPLACE FUNCTION match_documents_carole(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  agent_filter text DEFAULT 'carole'
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  filename text,
  agent_owner text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.filename,
    d.agent_owner
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (d.agent_owner = agent_filter OR d.agent_owner = 'shared')
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================================
-- STEP 4: Extend messages table to track which agent responded
-- ============================================================================

-- Add agent column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS agent TEXT CHECK (agent IN ('audrey', 'carole', 'escalate'));

-- Create index for agent analytics
CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent);

-- ============================================================================
-- STEP 5: Create rate limiting function
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_conversation_id text,
  p_max_messages int DEFAULT 10,
  p_window_seconds int DEFAULT 60
)
RETURNS TABLE (
  allowed boolean,
  remaining int
)
LANGUAGE plpgsql
AS $$
DECLARE
  message_count int;
  remaining_count int;
BEGIN
  -- Count messages in the time window
  SELECT COUNT(*)
  INTO message_count
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND role = 'user'
    AND created_at > NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Calculate remaining
  remaining_count := GREATEST(0, p_max_messages - message_count);

  -- Return result
  RETURN QUERY SELECT
    message_count < p_max_messages AS allowed,
    remaining_count AS remaining;
END;
$$;

-- ============================================================================
-- STEP 6: Create analytics view for agent usage
-- ============================================================================

CREATE OR REPLACE VIEW agent_analytics AS
SELECT
  DATE(m.created_at) as date,
  m.agent,
  COUNT(*) as message_count,
  COUNT(DISTINCT m.conversation_id) as conversation_count,
  AVG(LENGTH(m.content)) as avg_message_length
FROM messages m
WHERE m.role = 'assistant'
  AND m.agent IS NOT NULL
GROUP BY DATE(m.created_at), m.agent
ORDER BY date DESC, agent;

-- ============================================================================
-- STEP 7: Create function to tag existing documents
-- ============================================================================

-- Helper function to bulk tag documents
CREATE OR REPLACE FUNCTION tag_documents_by_keywords(
  p_agent_owner text,
  p_keywords text[]
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count int;
BEGIN
  UPDATE documents
  SET agent_owner = p_agent_owner
  WHERE agent_owner IS NULL
    AND (
      filename ILIKE ANY(p_keywords)
      OR content ILIKE ANY(p_keywords)
    );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ============================================================================
-- STEP 8: Example data - Tag existing documents (CUSTOMIZE KEYWORDS)
-- ============================================================================

-- Tag Audrey's documents (automation, funnels, email marketing)
SELECT tag_documents_by_keywords(
  'audrey',
  ARRAY[
    '%tunnel%',
    '%funnel%',
    '%email%',
    '%automation%',
    '%kajabi%',
    '%zapier%',
    '%conversion%',
    '%analytics%'
  ]
);

-- Tag Carole's documents (Instagram, creation, content)
SELECT tag_documents_by_keywords(
  'carole',
  ARRAY[
    '%instagram%',
    '%reel%',
    '%story%',
    '%stories%',
    '%post%',
    '%contenu%',
    '%création%',
    '%créa%',
    '%design%',
    '%branding%'
  ]
);

-- Tag shared documents
UPDATE documents
SET agent_owner = 'shared'
WHERE agent_owner IS NULL;

-- ============================================================================
-- STEP 9: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN documents.agent_owner IS 'Which agent owns this document: audrey (automation), carole (creation), or shared';
COMMENT ON COLUMN documents.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN documents.category IS 'Document category (e.g., tutorial, guide, example)';
COMMENT ON COLUMN documents.priority IS 'Priority for retrieval (1=highest, higher numbers=lower priority)';

COMMENT ON FUNCTION match_documents_audrey IS 'Vector similarity search for Audrey''s knowledge base (automation & funnels)';
COMMENT ON FUNCTION match_documents_carole IS 'Vector similarity search for Carole''s knowledge base (Instagram & creation)';
COMMENT ON FUNCTION check_rate_limit IS 'Check if conversation is within rate limits';
COMMENT ON FUNCTION tag_documents_by_keywords IS 'Bulk tag documents by keyword matching';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check agent distribution
-- SELECT agent_owner, COUNT(*) FROM documents GROUP BY agent_owner;

-- Check recent messages by agent
-- SELECT agent, COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY agent;

-- Test vector search for Audrey
-- SELECT * FROM match_documents_audrey('[0.1, 0.2, ...]'::vector(1536), 0.7, 5);

-- Test vector search for Carole
-- SELECT * FROM match_documents_carole('[0.1, 0.2, ...]'::vector(1536), 0.7, 5);

-- Test rate limit
-- SELECT * FROM check_rate_limit('test-conversation-id', 10, 60);
