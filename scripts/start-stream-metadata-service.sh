#!/bin/bash

PROJECT_ROOT=$(basename $(git rev-parse --show-toplevel))

if [ "$PROJECT_ROOT" == "river" ]; then
    RUN_DIR=$(git rev-parse --show-toplevel)/packages/stream-metadata
else
    RUN_DIR=$(git rev-parse --show-toplevel)/river/packages/stream-metadata
fi

echo "Starting stream-metadata service in $RUN_DIR"

pushd $RUN_DIR
cp ./.env.local.sample .env.local
yarn dev
