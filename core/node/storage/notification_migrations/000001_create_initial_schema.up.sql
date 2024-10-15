CREATE TABLE IF NOT EXISTS userpreferences (
    user_id bytea PRIMARY KEY,
    dm smallint,
    gdm smallint);

CREATE TABLE IF NOT EXISTS spaces (
    user_id bytea,
    space_id bytea,
    setting smallint,
    PRIMARY KEY (user_id, space_id));

CREATE TABLE IF NOT EXISTS channels (
    user_id bytea,
    channel_id bytea,
    space_id bytea,
    setting smallint,
    PRIMARY KEY (user_id, channel_id));

CREATE TABLE IF NOT EXISTS webpushsubscriptions (
    key_auth varchar,
    key_p256dh varchar,
    endpoint varchar NOT NULL,
    user_id bytea NOT NULL,
    PRIMARY KEY (key_auth, key_p256dh));

CREATE INDEX WEB_SUB_USER_ID_IDX ON webpushsubscriptions USING hash (user_id);

CREATE TABLE IF NOT EXISTS apnpushsubscriptions (
    device_token bytea PRIMARY KEY,
    user_id bytea NOT NULL);

CREATE INDEX APN_SUB_USER_ID_IDX ON apnpushsubscriptions USING hash (user_id);

CREATE TABLE IF NOT EXISTS singlenodekey (
  uuid VARCHAR NOT NULL,
  storage_connection_time TIMESTAMP NOT NULL,
  info VARCHAR NOT NULL);
