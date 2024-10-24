DO $$
	DECLARE

	suffix CHAR(2);
	i INT;

	BEGIN

	FOR i IN 0..255 LOOP
		suffix = LPAD(TO_HEX(i), 2, '0');

		EXECUTE 'CREATE TABLE IF NOT EXISTS miniblocks_' || suffix || ' (
  			stream_id CHAR(64) NOT NULL,
  			seq_num BIGINT NOT NULL,
  			blockdata BYTEA NOT NULL,
  			PRIMARY KEY (stream_id, seq_num)
  		)';

        EXECUTE 'CREATE TABLE IF NOT EXISTS minipools_' || suffix || ' (
            stream_id CHAR(64) NOT NULL,
            generation BIGINT NOT NULL ,
            slot_num BIGINT NOT NULL ,
            envelope BYTEA,
            PRIMARY KEY (stream_id, generation, slot_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblock_candidates_' || suffix || ' (
            stream_id CHAR(64) NOT NULL,
            seq_num BIGINT NOT NULL,
            block_hash CHAR(64) NOT NULL,
            blockdata BYTEA NOT NULL,
            PRIMARY KEY (stream_id, seq_num, block_hash)
        )';

	END LOOP;
END;
$$;

-- Track table migration status
ALTER TABLE es ADD migrated BOOLEAN NOT NULL DEFAULT FALSE;
