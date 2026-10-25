ALTER TABLE binders
 ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 180),
 ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT 'navy';
