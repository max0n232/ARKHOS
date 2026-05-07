-- Migration 005: trades ↔ signals_v2 loop closure
-- Purpose: link paper trade outcomes back to the signals that generated them,
-- so RAG/MacroAgent eval can score signal quality by R-multiple later.
-- Also adds index supporting Close Trade lookup (ORDER BY opened_at DESC).

BEGIN;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS signal_id UUID;

-- Soft FK: ON DELETE SET NULL so deleting a signal doesn't cascade-destroy outcome history.
-- Wrapped in DO block so re-running the migration is safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trades_signal_id_fkey'
  ) THEN
    ALTER TABLE public.trades
      ADD CONSTRAINT trades_signal_id_fkey
      FOREIGN KEY (signal_id) REFERENCES public.signals_v2(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS trades_symbol_status_opened_idx
  ON public.trades (symbol, status, opened_at DESC);

CREATE INDEX IF NOT EXISTS trades_signal_id_idx
  ON public.trades (signal_id) WHERE signal_id IS NOT NULL;

COMMENT ON COLUMN public.trades.signal_id IS
  'Optional FK to signals_v2.id. Populated when TV alert message encodes "signals_v2:<uuid>" in strategy field.';

COMMIT;
