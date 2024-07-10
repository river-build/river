#!/bin/bash
set -euo pipefail
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
cd ..

function checkBotEnvs() {
    source .env
    if [ -z "$SPACE_ID" ]; then
        echo "SPACE_ID is not set"
        exit 1
    fi
    if [ -z "$CHANNEL_ID" ]; then
        echo "CHANNEL_ID is not set"
        exit 1
    fi
    if [ -z "$MNEMONIC" ]; then
        echo "MNEMONIC is not set"
        exit 1
    fi
}

function start() {
    echo "Running bot in production"
    export DEBUG=
    export NODE_ENV="production"

    checkBotEnvs

    yarn start
}

function start_dev() {
    echo "Running bot in development"
    export DEBUG="csb:*"
    export NODE_ENV="development"
    export NODE_TLS_REJECT_UNAUTHORIZED=0 

    checkBotEnvs

    yarn dev
}

if [ $# -eq 0 ]; then
    start
elif [ "$1" == "dev" ]; then
    start_dev
fi
