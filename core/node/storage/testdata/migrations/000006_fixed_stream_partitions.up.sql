DO $$
	DECLARE

	suffix CHAR(2);
	i INT;

	BEGIN

    -- For test postgres schemas, create 4 partitions instead of the normal 256.
	FOR i IN 0..3 LOOP
		suffix = LPAD(TO_HEX(i), 2, '0');

        -- Media stream partitions
        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblocks_m' || suffix || ' (
            stream_id CHAR(64) NOT NULL,
            seq_num BIGINT NOT NULL,
            blockdata BYTEA NOT NULL,
            PRIMARY KEY (stream_id, seq_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS minipools_m' || suffix || ' (
            stream_id CHAR(64) NOT NULL,
            generation BIGINT NOT NULL ,
            slot_num BIGINT NOT NULL ,
            envelope BYTEA,
            PRIMARY KEY (stream_id, generation, slot_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblock_candidates_m' || suffix || ' (
            stream_id CHAR(64) NOT NULL,
            seq_num BIGINT NOT NULL,
            block_hash CHAR(64) NOT NULL,
            blockdata BYTEA NOT NULL,
            PRIMARY KEY (stream_id, seq_num, block_hash)
        )';

        -- Partitions for regular streams
        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblocks_r' || suffix || ' (
            stream_id CHAR(64) NOT NULL,
            seq_num BIGINT NOT NULL,
            blockdata BYTEA NOT NULL,
            PRIMARY KEY (stream_id, seq_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS minipools_r' || suffix || ' (
            stream_id CHAR(64) NOT NULL,
            generation BIGINT NOT NULL ,
            slot_num BIGINT NOT NULL ,
            envelope BYTEA,
            PRIMARY KEY (stream_id, generation, slot_num)
        )';

        EXECUTE 'CREATE TABLE IF NOT EXISTS miniblock_candidates_r' || suffix || ' (
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
