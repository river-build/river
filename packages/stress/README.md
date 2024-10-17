# Stress

## Run it locally

```
    ./scripts/localhost_chat_setup.sh && ./scripts/localhost_chat.sh
```

### Totally optional, if you want to test persistence

```
    ./scripts/start_redis.sh
```

## Run schema-based test

You **must** run redis, as redis is used for container orchestration.

```
    ./scripts/start_redis.sh
    REDIS_HOST="localhost" ./scripts/setup_schema_chat.sh
    REDIS_HOST="localhost" ./scripts/localhost_schemachat.sh
```
