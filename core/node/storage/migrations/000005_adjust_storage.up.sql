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
  stream_id CHAR(64) PRIMARY KEY,
  latest_snapshot_miniblock BIGINT NOT NULL);
ALTER TABLE es ALTER COLUMN stream_id SET STORAGE PLAIN;
