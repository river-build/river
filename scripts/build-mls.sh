#!/bin/bash
set -euo pipefail

cargo build --release --manifest-path ./mls/mls-tools/crates/mlslib/Cargo.toml
cp ./mls/mls-tools/target/release/libmls* ./core/node/mls_service/
