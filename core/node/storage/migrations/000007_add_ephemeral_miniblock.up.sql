-- Add ephemeral miniblock state as a new column to the miniblocks table
ALTER TABLE miniblocks ADD ephemeral BOOLEAN DEFAULT NULL;
