-- Add ephemeral stream state
ALTER TABLE es ADD COLUMN IF NOT EXISTS ephemeral BOOLEAN NOT NULL DEFAULT FALSE;