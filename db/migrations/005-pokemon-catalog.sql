-- Shared public catalog data only. Never store user/binder data in this cache.
CREATE TABLE IF NOT EXISTS pokemon_catalog_cache (
 cache_key text PRIMARY KEY,
 payload jsonb NOT NULL,
 expires_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pokemon_catalog_cache ENABLE ROW LEVEL SECURITY;
-- No public policies: only server routes use the owner connection.
