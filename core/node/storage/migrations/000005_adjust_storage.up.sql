CREATE TABLE IF NOT EXISTS singlenodekey (
  uuid VARCHAR NOT NULL,
  storage_connection_time TIMESTAMP NOT NULL,
  info VARCHAR NOT NULL
);

CREATE OR REPLACE FUNCTION notify_on_upsert()
    RETURNS TRIGGER
AS
$$
    BEGIN
    PERFORM pg_notify(TG_TABLE_NAME, TG_TABLE_SCHEMA);
    RETURN NEW;
    END;
$$ LANGUAGE PLPGSQL;

DROP TRIGGER IF EXISTS notify_on_singlenodekey_upserts on singlenodekey;
CREATE TRIGGER notify_on_singlenodekey_upserts
    AFTER INSERT OR UPDATE
    ON singlenodekey
    FOR EACH ROW
    EXECUTE PROCEDURE notify_on_upsert();

CREATE TABLE IF NOT EXISTS es (
  stream_id CHAR(64) PRIMARY KEY STORAGE PLAIN,
  latest_snapshot_miniblock BIGINT NOT NULL);

CREATE TABLE IF NOT EXISTS miniblocks (
  stream_id CHAR(64) NOT NULL STORAGE PLAIN,
  seq_num BIGINT NOT NULL,
  blockdata BYTEA NOT NULL STORAGE EXTERNAL,
  PRIMARY KEY (stream_id, seq_num)
  ) PARTITION BY LIST (stream_id);

CREATE TABLE IF NOT EXISTS minipools (
  stream_id CHAR(64) NOT NULL STORAGE PLAIN,
  generation BIGINT NOT NULL ,
  slot_num BIGINT NOT NULL ,
  envelope BYTEA STORAGE EXTERNAL,
  PRIMARY KEY (stream_id, generation, slot_num)
  ) PARTITION BY LIST (stream_id);


CREATE TABLE IF NOT EXISTS miniblock_candidates (
  stream_id CHAR(64) NOT NULL STORAGE PLAIN,
  seq_num BIGINT NOT NULL,
  block_hash CHAR(64) NOT NULL STORAGE PLAIN,
  blockdata BYTEA NOT NULL STORAGE EXTERNAL,
  PRIMARY KEY (stream_id, seq_num, block_hash)
) PARTITION BY LIST (stream_id);
