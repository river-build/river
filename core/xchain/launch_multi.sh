#!/bin/bash
set -euo pipefail

# Change the current working directory to the directory of the script
cd "$(dirname "$0")"

: ${RUN_ENV:?}

RUN_FILES_DIR="../run_files"
BASE_DIR="${RUN_FILES_DIR}/${RUN_ENV}/xchain"
mkdir -p "${BASE_DIR}"

SCRIPT_PID_FILE="${BASE_DIR}/launch_multi.pid"

# stop previous instances
./stop_multi.sh

# Record the script's own PID
echo $$ > "$SCRIPT_PID_FILE"

make build

# Register operator
source ../../contracts/.env.localhost
OPERATOR_ADDRESS=$(cast wallet addr $LOCAL_PRIVATE_KEY)

echo "Registration of operator $OPERATOR_ADDRESS in base registry at address $BASE_REGISTRY_ADDRESS"

# register operator
cast send \
    --rpc-url http://127.0.0.1:8545 \
    --private-key $LOCAL_PRIVATE_KEY \
    $BASE_REGISTRY_ADDRESS \
    "registerOperator(address)" \
    $OPERATOR_ADDRESS \
    2 > /dev/null

# set operator to approved
cast send \
    --rpc-url http://127.0.0.1:8545 \
    --private-key $TESTNET_PRIVATE_KEY \
    $BASE_REGISTRY_ADDRESS \
    "setOperatorStatus(address,uint8)" \
    $OPERATOR_ADDRESS \
    2 \
    2 > /dev/null


# Get number of instances by counting instance directories
N=$(ls -d ${BASE_DIR}/instance_* 2>/dev/null | wc -l)

# Function to handle Ctrl+C and wait for the child processes
cleanup() {
  echo "Sending SIGINT to child processes..."

  for (( i=1; i<=N; i++ ))
  do
    instance_dir="${BASE_DIR}/instance_${i}"

    if [[ -f "${instance_dir}/node.pid" ]]; then
      pid=$(cat "${instance_dir}/node.pid")
      echo "Waiting on in ${instance_dir} with PID $pid has completed."
      kill "$pid" 2>/dev/null || true
      wait "$pid" || true
      echo "Instance in ${instance_dir} with PID $pid has completed."
      rm -f "${instance_dir}/node.pid"
    fi
  done
  echo "Sent SIGINT to child processes..."
}

# Trap Ctrl+C and call cleanup()
trap cleanup SIGINT SIGTERM

# Fund the instances
# allow for defining a path to run an alternative fund_multi.sh script
if [ -z "${PATH_TO_FUND_MULTI:-}" ]; then
    echo "PATH_TO_FUND_MULTI environment variable is not set. Using default path."
    ./fund_multi.sh
else
    echo "Using custom path: ${PATH_TO_FUND_MULTI}"
    "${PATH_TO_FUND_MULTI}"
fi

# Loop to launch N instances from instance directories
for (( i=1; i<=N; i++ ))
do
  INSTANCE_DIR="${BASE_DIR}/instance_${i}"
  cp ../run_files/bin/river_node "${INSTANCE_DIR}/bin/river_node"
  pushd "${INSTANCE_DIR}"

      NODE_ADDRESS=$(cat wallet/node_address)
      echo "Registration of node $NODE_ADDRESS in base registry at address $BASE_REGISTRY_ADDRESS"
      cast send \
        --rpc-url http://127.0.0.1:8545 \
        --private-key $LOCAL_PRIVATE_KEY \
        $BASE_REGISTRY_ADDRESS \
        "registerNode(address)" \
        $NODE_ADDRESS \
        2 > /dev/null

  "./bin/river_node" run xchain &
  node_pid=$!
  pwd
  echo $node_pid > node.pid
  echo "Launched instance $i from ${INSTANCE_DIR} with PID $node_pid"
  popd
done

wait

rm $SCRIPT_PID_FILE
echo "All child processes have completed."
