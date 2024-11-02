-- This table may already exist in the schema and, if so, use the setting
-- stored in the table to determine partition count.
CREATE TABLE IF NOT EXISTS stream_settings (
	name VARCHAR NOT NULL,
	value VARCHAR NOT NULL,
	PRIMARY KEY (name)
);

INSERT INTO stream_settings (name, value) VALUES ('num_partitions', '256') on CONFLICT (name) DO NOTHING;

DO $$
	DECLARE

	suffix CHAR(2);
	i INT;

    numPartitions INT;

	BEGIN

    SELECT CAST(value as INTEGER) from stream_settings where name = 'num_partitions' into numPartitions;

	FOR i IN 0.. numPartitions LOOP
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
