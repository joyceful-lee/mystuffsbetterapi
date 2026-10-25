ALTER TABLE cards
 ADD COLUMN IF NOT EXISTS deck text NOT NULL DEFAULT '' CHECK (length(deck) <= 100),
 ADD COLUMN IF NOT EXISTS card_number text NOT NULL DEFAULT '' CHECK (length(card_number) <= 40);
ALTER TABLE cards ALTER COLUMN image SET DEFAULT '';
