-- Alter CHAR(64) columns to be INLINE and UNCOMPRESSED
ALTER TABLE miniblock_candidates ALTER COLUMN stream_id SET STORAGE PLAIN;
ALTER TABLE miniblock_candidates ALTER COLUMN block_hash SET STORAGE PLAIN;

ALTER TABLE es ALTER COLUMN stream_id SET STORAGE PLAIN;

ALTER TABLE miniblocks ALTER COLUMN stream_id SET STORAGE PLAIN;

ALTER TABLE minipools ALTER COLUMN stream_id SET STORAGE PLAIN;

-- Alter BYTEA columns to be UNCOMPRESSED
ALTER TABLE miniblock_candidates ALTER COLUMN blockdata SET STORAGE EXTERNAL;

ALTER TABLE miniblocks ALTER COLUMN blockdata SET STORAGE EXTERNAL;

ALTER TABLE minipools ALTER COLUMN envelope SET STORAGE EXTERNAL;

-- Apply changes to existing data by performing VACUUM FULL
VACUUM FULL miniblock_candidates;
VACUUM FULL es;
VACUUM FULL miniblocks;
VACUUM FULL minipools;