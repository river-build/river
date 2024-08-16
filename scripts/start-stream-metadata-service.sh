#!/bin/bash

# Set RIVER_ROOT based on whether an argument is provided
if [ -n "$1" ]; then
    RIVER_ROOT="$1"
else
    # Determine the Git project root
    RIVER_ROOT=$(git rev-parse --show-toplevel)
fi

RUN_DIR="$RIVER_ROOT/packages/stream-metadata"

echo "Starting stream-metadata service in $RUN_DIR"
pushd "$RUN_DIR"

cp ./.env.local.sample .env.local
yarn dev
