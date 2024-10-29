DO $$
	DECLARE

	suffix CHAR(2);
	i INT;

	BEGIN

	FOR i IN 0..255 LOOP
		suffix = LPAD(TO_HEX(i), 2, '0');

        -- Media stream partitions
        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblocks_m' || suffix || ' (
            stream_id CHAR(64) STORAGE PLAIN NOT NULL,
            seq_num BIGINT NOT NULL,
            blockdata BYTEA STORAGE EXTERNAL NOT NULL,
            PRIMARY KEY (stream_id, seq_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS minipools_m' || suffix || ' (
            stream_id CHAR(64) STORAGE PLAIN NOT NULL,
            generation BIGINT NOT NULL ,
            slot_num BIGINT NOT NULL ,
            envelope BYTEA STORAGE EXTERNAL,
            PRIMARY KEY (stream_id, generation, slot_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblock_candidates_m' || suffix || ' (
            stream_id CHAR(64) STORAGE PLAIN NOT NULL,
            seq_num BIGINT NOT NULL,
            block_hash CHAR(64) STORAGE PLAIN NOT NULL,
            blockdata BYTEA STORAGE EXTERNAL NOT NULL,
            PRIMARY KEY (stream_id, seq_num, block_hash)
        )';

        -- Partitions for regular streams
        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblocks_r' || suffix || ' (
            stream_id CHAR(64) STORAGE PLAIN NOT NULL,
            seq_num BIGINT NOT NULL,
            blockdata BYTEA STORAGE EXTERNAL NOT NULL,
            PRIMARY KEY (stream_id, seq_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS minipools_r' || suffix || ' (
            stream_id CHAR(64) STORAGE PLAIN NOT NULL,
            generation BIGINT NOT NULL ,
            slot_num BIGINT NOT NULL ,
            envelope BYTEA STORAGE EXTERNAL,
            PRIMARY KEY (stream_id, generation, slot_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblock_candidates_r' || suffix || ' (
            stream_id CHAR(64) STORAGE PLAIN NOT NULL,
            seq_num BIGINT NOT NULL,
            block_hash CHAR(64) STORAGE PLAIN NOT NULL,
            blockdata BYTEA STORAGE EXTERNAL NOT NULL,
            PRIMARY KEY (stream_id, seq_num, block_hash)
        )';
	END LOOP;
END;
$$;

-- Track table migration status
ALTER TABLE es ADD migrated BOOLEAN NOT NULL DEFAULT FALSE;
