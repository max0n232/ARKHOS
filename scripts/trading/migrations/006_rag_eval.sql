-- Migration 006: RAG retrieval evaluation tables
-- Purpose: weekly hit@3 / hit@1 baseline on knowledge_chunks retrieval.
-- Detects: embedding model drift, HNSW index corruption, chunk-content rotation.

BEGIN;

CREATE TABLE IF NOT EXISTS public.rag_eval_set (
  id                  SERIAL PRIMARY KEY,
  query               TEXT NOT NULL,
  expected_book_slug  VARCHAR(64) NOT NULL,
  expected_chunk_idx  INTEGER NOT NULL,
  notes               TEXT,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rag_eval_set_expected_fk
    FOREIGN KEY (expected_book_slug, expected_chunk_idx)
    REFERENCES public.knowledge_chunks (book_slug, chunk_idx)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS rag_eval_set_active_idx
  ON public.rag_eval_set (active) WHERE active;

CREATE TABLE IF NOT EXISTS public.rag_eval_runs (
  id                  SERIAL PRIMARY KEY,
  run_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_queries       INTEGER NOT NULL,
  hit_at_1            INTEGER NOT NULL,
  hit_at_3            INTEGER NOT NULL,
  hit_at_1_pct        NUMERIC(5,2) GENERATED ALWAYS AS
                       (CASE WHEN total_queries > 0
                             THEN ROUND(100.0 * hit_at_1 / total_queries, 2)
                             ELSE 0 END) STORED,
  hit_at_3_pct        NUMERIC(5,2) GENERATED ALWAYS AS
                       (CASE WHEN total_queries > 0
                             THEN ROUND(100.0 * hit_at_3 / total_queries, 2)
                             ELSE 0 END) STORED,
  embedding_model     VARCHAR(64) NOT NULL DEFAULT 'gemini-embedding-001',
  per_query_results   JSONB,
  notes               TEXT
);

CREATE INDEX IF NOT EXISTS rag_eval_runs_run_at_idx
  ON public.rag_eval_runs (run_at DESC);

-- Grants for n8n_admin (the role n8n credentials connect as).
-- Without these, n8n nodes hit "permission denied for table".
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.rag_eval_set TO n8n_admin;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.rag_eval_runs TO n8n_admin;
GRANT USAGE, SELECT ON SEQUENCE public.rag_eval_set_id_seq TO n8n_admin;
GRANT USAGE, SELECT ON SEQUENCE public.rag_eval_runs_id_seq TO n8n_admin;

COMMIT;
