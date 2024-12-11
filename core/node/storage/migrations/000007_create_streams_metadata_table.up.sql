CREATE TABLE IF NOT EXISTS streams_metadata (
    stream_id CHAR(64) NOT NULL,
    riverblock_num BIGINT NOT NULL,
    riverblock_log_index BIGINT NOT NULL,
    nodes CHAR(20)[] NOT NULL,
    miniblock_hash CHAR(64) NOT NULL,
    miniblock_num BIGINT NOT NULL,
    is_sealed BOOL NOT NULL,
    PRIMARY KEY (stream_id)
);
