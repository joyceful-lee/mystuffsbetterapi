CREATE TABLE IF NOT EXISTS collection_preferences (
 user_id text PRIMARY KEY,
 sample_hidden boolean NOT NULL DEFAULT false
);
ALTER TABLE collection_preferences ENABLE ROW LEVEL SECURITY;
