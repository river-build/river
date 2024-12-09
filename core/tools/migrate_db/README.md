### Build migration tool

Update `river_migrate_db.env` with correct parameters.

Source DB still can be in use at this point.

go build -o river_migrate_db .

./river_migrate_db help
./river_migrate_db source test # test source config
./river_migrate_db target test # test target config

Note: shutdown node process connected to source DB during migration process below.

### Run migration tool creating target partitions matching source

    ./river_migrate_db target create  # create target schema (i.e. db partition)
    ./river_migrate_db target init  # create targe tables

    # shutdown container that is connected to source db

    ./river_migrate_db copy  # copy data from source to target

    # Inspect specific stream content
    ./river_migrate_db source inspect <streamId>
    ./river_migrate_db target inspect <streamId>

    # reconfigure container to use target db

For command-line options use `help` command.

List of env vars or settings in `river_migrate_db.env`:

    RIVER_DB_SOURCE_URL
    RIVER_DB_TARGET_URL
    RIVER_DB_SOURCE_PASSWORD  # if unset here or in URL, read from .pgpass
    RIVER_DB_TARGET_PASSWORD  # if unset here or in URL, read from .pgpass
    RIVER_DB_SCHEMA
    RIVER_DB_SCHEMA_TARGET_OVERWRITE
    RIVER_DB_NUM_WORKERS
    RIVER_DB_TX_SIZE
    RIVER_DB_PROGRESS_REPORT_INTERVAL  # duration, i.e. `10s`
