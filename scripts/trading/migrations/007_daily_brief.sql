-- Migration 007: Daily Brief infrastructure
-- Universe of monitored instruments + brief history + news dedup cache.

BEGIN;

CREATE TABLE IF NOT EXISTS public.instruments_universe (
  id              SERIAL PRIMARY KEY,
  symbol          VARCHAR(32) NOT NULL UNIQUE,
  yahoo_symbol    VARCHAR(32) NOT NULL,
  display_name    VARCHAR(128) NOT NULL,
  asset_class     VARCHAR(32) NOT NULL,
  exchange        VARCHAR(32),
  cfd_friendly    BOOLEAN NOT NULL DEFAULT TRUE,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS instruments_universe_active_idx
  ON public.instruments_universe (active, asset_class) WHERE active;

CREATE TABLE IF NOT EXISTS public.daily_briefs (
  id              SERIAL PRIMARY KEY,
  brief_date      DATE NOT NULL UNIQUE,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_context     JSONB NOT NULL,
  llm_output      JSONB NOT NULL,
  validated       BOOLEAN NOT NULL DEFAULT FALSE,
  setups_count    INTEGER NOT NULL DEFAULT 0,
  setups_dropped  INTEGER NOT NULL DEFAULT 0,
  telegram_text   TEXT,
  llm_model       VARCHAR(64),
  cost_usd        NUMERIC(10,4)
);

CREATE INDEX IF NOT EXISTS daily_briefs_date_idx
  ON public.daily_briefs (brief_date DESC);

CREATE TABLE IF NOT EXISTS public.news_cache (
  id              BIGSERIAL PRIMARY KEY,
  url_hash        VARCHAR(64) NOT NULL UNIQUE,
  source          VARCHAR(64) NOT NULL,
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,
  published_at    TIMESTAMPTZ NOT NULL,
  cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tags            TEXT[],
  relevance_score INTEGER,
  summary         TEXT
);

CREATE INDEX IF NOT EXISTS news_cache_published_idx
  ON public.news_cache (published_at DESC);
CREATE INDEX IF NOT EXISTS news_cache_relevance_idx
  ON public.news_cache (relevance_score DESC) WHERE relevance_score IS NOT NULL;

-- n8n_admin grants
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.instruments_universe TO n8n_admin;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.daily_briefs TO n8n_admin;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.news_cache TO n8n_admin;
GRANT USAGE, SELECT ON SEQUENCE public.instruments_universe_id_seq TO n8n_admin;
GRANT USAGE, SELECT ON SEQUENCE public.daily_briefs_id_seq TO n8n_admin;
GRANT USAGE, SELECT ON SEQUENCE public.news_cache_id_seq TO n8n_admin;

-- Seed instruments universe (30 instruments — commodities, metals, indices, stocks)
INSERT INTO public.instruments_universe (symbol, yahoo_symbol, display_name, asset_class, exchange) VALUES
  -- Commodities (5)
  ('XAUUSD',  'GC=F',     'Gold Spot',         'metals',     'COMEX'),
  ('XAGUSD',  'SI=F',     'Silver Spot',       'metals',     'COMEX'),
  ('USOIL',   'CL=F',     'WTI Crude Oil',     'commodities','NYMEX'),
  ('UKOIL',   'BZ=F',     'Brent Crude Oil',   'commodities','ICE'),
  ('NATGAS',  'NG=F',     'Natural Gas',       'commodities','NYMEX'),
  -- Metals industrial (3)
  ('COPPER',  'HG=F',     'Copper',            'metals',     'COMEX'),
  ('PLATINUM','PL=F',     'Platinum',          'metals',     'NYMEX'),
  ('PALLADIUM','PA=F',    'Palladium',         'metals',     'NYMEX'),
  -- Equity indices (5)
  ('SPX500',  '^GSPC',    'S&P 500',           'index',      'CBOE'),
  ('NAS100',  '^NDX',     'Nasdaq 100',        'index',      'NASDAQ'),
  ('GER40',   '^GDAXI',   'DAX 40',            'index',      'XETRA'),
  ('STOXX50', '^STOXX50E','Euro Stoxx 50',     'index',      'EUREX'),
  ('UK100',   '^FTSE',    'FTSE 100',          'index',      'LSE'),
  -- Stocks (10 top liquid CFD)
  ('NVDA',    'NVDA',     'NVIDIA',            'stock',      'NASDAQ'),
  ('AAPL',    'AAPL',     'Apple',             'stock',      'NASDAQ'),
  ('MSFT',    'MSFT',     'Microsoft',         'stock',      'NASDAQ'),
  ('GOOGL',   'GOOGL',    'Alphabet A',        'stock',      'NASDAQ'),
  ('META',    'META',     'Meta Platforms',    'stock',      'NASDAQ'),
  ('AMZN',    'AMZN',     'Amazon',            'stock',      'NASDAQ'),
  ('TSLA',    'TSLA',     'Tesla',             'stock',      'NASDAQ'),
  ('COIN',    'COIN',     'Coinbase',          'stock',      'NASDAQ'),
  ('AMD',     'AMD',      'AMD',               'stock',      'NASDAQ'),
  ('JPM',     'JPM',      'JPMorgan Chase',    'stock',      'NYSE'),
  -- Macro context indicators (4 — fetched but not for setups)
  ('DXY',     'DX-Y.NYB', 'US Dollar Index',   'fx_idx',     'ICE'),
  ('VIX',     '^VIX',     'CBOE VIX',          'volatility', 'CBOE'),
  ('US10Y',   '^TNX',     'US 10Y Yield',      'rates',      'CBOT'),
  ('US02Y',   '^IRX',     'US 2Y Yield',       'rates',      'CBOT')
ON CONFLICT (symbol) DO NOTHING;

COMMIT;
