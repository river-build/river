CREATE TABLE IF NOT EXISTS usersettings (
  user_id bytea PRIMARY KEY,
  settings bytea NOT NULL);

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
