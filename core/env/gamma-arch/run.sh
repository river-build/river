#!/bin/bash
set -euo pipefail
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"

go run ../../river_node/main.go --config ../common/config.yaml --config ../gamma/config.yaml --config config.yaml "$@"
