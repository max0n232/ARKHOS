-- 008_portfolio_reviews.sql
-- Weekly Portfolio Review Agent output sink.
-- Consumer of: performance_context (scorecard), knowledge_chunks (RAG citations).
-- Producer for: future Decision Engine v2 (reads actions[] to adjust signal confidence).
--
-- Rating scale (matches PM prompt enum):
--   Trust+      — system works exceptionally, no changes
--   Trust       — system works, minor tweaks only
--   Caution     — mixed results, throttle underperformers
--   Halt        — system fundamentally broken, pause for diagnostics
--   Restructure — architectural redesign needed

CREATE TABLE IF NOT EXISTS portfolio_reviews (
  id              SERIAL PRIMARY KEY,
  week            DATE NOT NULL,
  scorecard       JSONB NOT NULL,
  rating          TEXT NOT NULL CHECK (rating IN ('Trust+','Trust','Caution','Halt','Restructure')),
  verdict         TEXT NOT NULL,
  actions         JSONB NOT NULL DEFAULT '[]'::jsonb,
  citations       JSONB NOT NULL DEFAULT '[]'::jsonb,
  bull_argument   TEXT,
  bear_argument   TEXT,
  pm_rationale    TEXT,
  raw_responses   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (week)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_reviews_week ON portfolio_reviews(week DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_reviews_rating ON portfolio_reviews(rating);
