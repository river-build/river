ALTER TABLE miniblock_candidates
DROP CONSTRAINT miniblock_candidates_pkey;

ALTER TABLE miniblock_candidates
ADD CONSTRAINT miniblock_candidates_pkey 
PRIMARY KEY (stream_id, seq_num, block_hash);