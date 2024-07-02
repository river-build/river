#!/bin/sh
set -euo pipefail

cd "$(dirname "$0")"

cd ..

node ./scripts/make-config.js
