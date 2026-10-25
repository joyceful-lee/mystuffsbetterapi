CREATE TABLE IF NOT EXISTS binders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id text NOT NULL,
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
 game text NOT NULL DEFAULT 'Other',
 color text NOT NULL DEFAULT 'lime',
 bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 180),
 background_color text NOT NULL DEFAULT 'navy',
 theme text NOT NULL DEFAULT 'classic',
 position integer NOT NULL DEFAULT 0,
 cover_card_id uuid,
 share_token text UNIQUE,
 guest_source_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, guest_source_id)
);
CREATE INDEX IF NOT EXISTS binders_owner ON binders(user_id);
CREATE TABLE IF NOT EXISTS cards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 binder_id uuid NOT NULL REFERENCES binders(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
 deck text NOT NULL DEFAULT '' CHECK (length(deck) <= 100),
 card_number text NOT NULL DEFAULT '' CHECK (length(card_number) <= 40),
 image text NOT NULL DEFAULT '' CHECK (length(image) <= 350000),
 rarity text NOT NULL DEFAULT 'Common',
 favorite boolean NOT NULL DEFAULT false,
 position integer NOT NULL DEFAULT 0,
 guest_source_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(binder_id, guest_source_id)
);
CREATE INDEX IF NOT EXISTS cards_binder ON cards(binder_id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='binders_cover_card_id_fkey' AND conrelid='binders'::regclass) THEN
  ALTER TABLE binders ADD CONSTRAINT binders_cover_card_id_fkey FOREIGN KEY(cover_card_id) REFERENCES cards(id) ON DELETE SET NULL;
 END IF;
END $$;
ALTER TABLE binders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
-- No public policies: all access goes through authenticated server routes.
-- The server uses the owner connection and explicitly checks user_id.
CREATE TABLE IF NOT EXISTS collection_preferences (
 user_id text PRIMARY KEY,
 sample_hidden boolean NOT NULL DEFAULT false
);
ALTER TABLE collection_preferences ENABLE ROW LEVEL SECURITY;

-- Shared public catalog data only. Never store user/binder data in this cache.
CREATE TABLE IF NOT EXISTS pokemon_catalog_cache (
 cache_key text PRIMARY KEY,
 payload jsonb NOT NULL,
 expires_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pokemon_catalog_cache ENABLE ROW LEVEL SECURITY;
-- No public policies: only server routes use the owner connection.
