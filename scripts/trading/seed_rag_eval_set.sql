-- Seed rag_eval_set with 30 query→chunk pairs.
-- Proportional sample across 13 books. Query = chunk title.
-- Deterministic via setseed so re-runs produce same set.

BEGIN;

-- only seed if empty (idempotent)
DO $seed$
DECLARE
  existing INT;
BEGIN
  SELECT count(*) INTO existing FROM rag_eval_set;
  IF existing > 0 THEN
    RAISE NOTICE 'rag_eval_set already has % rows, skipping seed', existing;
    RETURN;
  END IF;

  PERFORM setseed(0.42);

  INSERT INTO rag_eval_set (query, expected_book_slug, expected_chunk_idx, notes)
  WITH targets(book_slug, n) AS (
    VALUES
      ('al-brooks-trends', 5),
      ('al-brooks-ranges', 3),
      ('dalton-mind-over-markets', 3),
      ('schwager-market-wizards', 3),
      ('van-tharp-trade-your-way', 3),
      ('al-brooks-reversals', 3),
      ('elder-trading-entsiklopediya', 2),
      ('wyckoff-method', 2),
      ('graham-intelligent-investor', 2),
      ('taleb-antifragile', 1),
      ('douglas-trading-in-the-zone', 1),
      ('kiyosaki-rich-dad', 1),
      ('coulling-volume-price-analysis', 1)
  ),
  ranked AS (
    SELECT k.book_slug, k.chunk_idx, k.title,
           ROW_NUMBER() OVER (PARTITION BY k.book_slug ORDER BY random()) AS rn
    FROM knowledge_chunks k
    WHERE k.title IS NOT NULL AND length(k.title) BETWEEN 10 AND 150
  )
  SELECT r.title, r.book_slug, r.chunk_idx, 'baseline-seed-2026-05-05'
  FROM ranked r
  JOIN targets t USING (book_slug)
  WHERE r.rn <= t.n;
END
$seed$;

\echo === Seeded eval set ===
SELECT count(*) AS total, count(DISTINCT expected_book_slug) AS books FROM rag_eval_set;
SELECT expected_book_slug, count(*) AS n FROM rag_eval_set GROUP BY expected_book_slug ORDER BY n DESC;

COMMIT;
