#!/bin/bash
set -euo pipefail
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
cd ..

# run scripts/localhost_chat_setup.sh to set up the environment variables

# List of environment files to source
ENV_FILES=(
    "./scripts/.env.storage"
)

# Loop through each file in the list
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        source "$file"
        echo "Sourced: $file"
    else
        echo "Skipped: $file file does not exist."
    fi
done

echo "stress/scripts/localhost_schemachat.sh"

export RIVER_ENV="${RIVER_ENV:-local_multi}"
export SESSION_ID="${SESSION_ID:-$(uuidgen)}"

# Actual used variables
export REDIS_HOST="${REDIS_HOST:-}"
export PROCESSES_PER_CONTAINER="${PROCESSES_PER_CONTAINER:-4}"
export CLIENTS_COUNT="${CLIENTS_COUNT:-8}"

export MNEMONIC="toy alien remain valid print employ age multiply claim student story aware" 
export WALLET_ADDRESS="0x95D7701A0Faa5F514B4c5B49bf66580fCE9ffbf7"
export BASE_CHAIN_RPC_URL="http://localhost:8545"
export RIVER_CHAIN_RPC_URL="http://localhost:8546"
export NODE_TLS_REJECT_UNAUTHORIZED=0 # allow unsigned against localhost
export NODE_ENV=development

export BASE_CHAIN_RPC_URL="http://localhost:8545"
export RIVER_CHAIN_RPC_URL="http://localhost:8546"
export NODE_TLS_REJECT_UNAUTHORIZED=0 # allow unsigned against localhost

# logging
export DEBUG="${DEBUG:-}"
if [ -z "$DEBUG" ]; then
    export DEBUG="stress:*"
fi
export DEBUG_DEPTH="${DEBUG_DEPTH:-10}"
export SINGLE_LINE_LOGS="true"

# optional deployment environment variables, all required if pointed to a custom deployment
export BASE_CHAIN_ID="${BASE_CHAIN_ID:-}" # not required if using deployment in packages/generated/deployments
export BASE_REGISTRY_ADDRESS="${BASE_REGISTRY_ADDRESS:-}" # not required if using deployment in packages/generated/deployments
export SPACE_FACTORY_ADDRESS="${SPACE_FACTORY_ADDRESS:-}" # not required if using deployment in packages/generated/deployments
export SPACE_OWNER_ADDRESS="${SPACE_OWNER_ADDRESS:-}" # not required if using deployment in packages/generated/deployments
export RIVER_CHAIN_ID="${RIVER_CHAIN_ID:-}" # not required if using deployment in packages/generated/deployments
export RIVER_REGISTRY_ADDRESS="${RIVER_REGISTRY_ADDRESS:-}" # not required if using deployment in packages/generated/deployments

# stride 
export CONTAINER_INDEX="${CONTAINER_INDEX:-0}"
export CONTAINER_COUNT="${CONTAINER_COUNT:-1}"
export PROCESSES_PER_CONTAINER="${PROCESSES_PER_CONTAINER:-1}"
export CLIENTS_COUNT="${CLIENTS_COUNT:-10}"

# validation
# if clients per process is greater than clients count, exit
if [ $PROCESSES_PER_CONTAINER -eq 0 ]; then
  echo "PROCESSES_PER_CONTAINER should be gte 0"
  exit 1
fi
if [ $CONTAINER_COUNT -gt $CLIENTS_COUNT ]; then
  echo "CONTAINER_COUNT cannot be greater than CLIENTS_COUNT"
  exit 1
fi

# calculate number of clients per container
export CLIENTS_PER_CONTAINER=$((CLIENTS_COUNT / CONTAINER_COUNT))
# calculate number of processes
export CLIENTS_PER_PROCESS=$((CLIENTS_PER_CONTAINER / PROCESSES_PER_CONTAINER))
# calculate the start index for this container
export PROCESS_START_INDEX=$((CONTAINER_INDEX * PROCESSES_PER_CONTAINER))
# calculate the end index for this container
export PROCESS_END_INDEX=$((PROCESS_START_INDEX + PROCESSES_PER_CONTAINER))

# print all these variables
echo "CONTAINER_INDEX: $CONTAINER_INDEX"
echo "CONTAINER_COUNT: $CONTAINER_COUNT"
echo "CLIENTS_PER_PROCESS: $CLIENTS_PER_PROCESS"
echo "CLIENTS_COUNT: $CLIENTS_COUNT"
echo "CLIENTS_PER_CONTAINER: $CLIENTS_PER_CONTAINER"
echo "PROCESSES_PER_CONTAINER: $PROCESSES_PER_CONTAINER"
echo "PROCESS_START_INDEX: $PROCESS_START_INDEX"
echo "PROCESS_END_INDEX: $PROCESS_END_INDEX"

if [ $((CONTAINER_COUNT * PROCESSES_PER_CONTAINER * CLIENTS_PER_PROCESS)) -ne $CLIENTS_COUNT ]; then
  echo "container count * processes per container * clients per process should equal clients count"
  exit 1
fi

# fund the root wallet
cast rpc -r $BASE_CHAIN_RPC_URL anvil_setBalance $WALLET_ADDRESS 10000000000000000000 > /dev/null

yarn build

# Array to hold process IDs
declare -a pids

# start the clients
for i in $(seq $PROCESS_START_INDEX $((PROCESS_END_INDEX - 1))); do  # seq is inclusive
  PROCESS_INDEX=$i CLIENTS_PER_PROCESS=$CLIENTS_PER_PROCESS yarn schema &
  pids+=($!)
done

# Wait for all processes to finish
for pid in "${pids[@]}"; do
  echo "Waiting on PID $pid to complete..."
  wait $pid || true
done

echo "All processes have completed."

