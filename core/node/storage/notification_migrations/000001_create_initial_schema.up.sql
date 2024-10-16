CREATE TABLE IF NOT EXISTS userpreferences (
    user_id bytea PRIMARY KEY NOT NULL,
    dm smallint NOT NULL,
    gdm smallint NOT NULL);

CREATE TABLE IF NOT EXISTS spaces (
    user_id bytea NOT NULL,
    space_id bytea NOT NULL,
    setting smallint NOT NULL,
    PRIMARY KEY (user_id, space_id));

CREATE TABLE IF NOT EXISTS channels (
    user_id bytea NOT NULL,
    channel_id bytea NOT NULL,
    space_id bytea,
    setting smallint NOT NULL,
    PRIMARY KEY (user_id, channel_id));

CREATE TABLE IF NOT EXISTS webpushsubscriptions (
    key_auth varchar NOT NULL,
    key_p256dh varchar NOT NULL,
    endpoint varchar NOT NULL,
    user_id bytea NOT NULL,
    PRIMARY KEY (key_auth, key_p256dh));

CREATE INDEX WEB_SUB_USER_ID_IDX ON webpushsubscriptions USING hash (user_id);

CREATE TABLE IF NOT EXISTS apnpushsubscriptions (
    device_token bytea PRIMARY KEY NOT NULL,
    user_id bytea NOT NULL);

CREATE INDEX APN_SUB_USER_ID_IDX ON apnpushsubscriptions USING hash (user_id);

CREATE TABLE IF NOT EXISTS singlenodekey (
  uuid VARCHAR NOT NULL,
  storage_connection_time TIMESTAMP NOT NULL,
  info VARCHAR NOT NULL);
