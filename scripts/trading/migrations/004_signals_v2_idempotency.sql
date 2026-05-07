-- Migration 004: signals_v2 event idempotency
-- Purpose: prevent duplicate signal inserts on n8n retry / webhook replay / timeout recovery.
-- Codex P0 finding from Aladdin v3 review.
-- Backfill: existing rows get NULL run_id/agent_version (legacy, partial UNIQUE excludes them).

BEGIN;

ALTER TABLE public.signals_v2
  ADD COLUMN IF NOT EXISTS run_id UUID,
  ADD COLUMN IF NOT EXISTS agent_version VARCHAR(32);

CREATE UNIQUE INDEX IF NOT EXISTS signals_v2_idempotency
  ON public.signals_v2 (run_id, instrument, agent_version)
  WHERE run_id IS NOT NULL AND agent_version IS NOT NULL;

COMMENT ON COLUMN public.signals_v2.run_id IS
  'n8n execution_id (UUID). Same run cannot insert two signals for same instrument+agent_version.';

COMMENT ON COLUMN public.signals_v2.agent_version IS
  'agent identifier with version (e.g., macro-v1, technical-v1). Drives idempotency partition.';

COMMIT;
