#!/bin/bash
set -euo pipefail

mkdir -p ./core/bin
cargo build --release --manifest-path ./mls/mls-tools/crates/mlslib/Cargo.toml
cp ./mls/mls-tools/target/release/libmls* ./core/node/mls_service/
cp ./mls/mls-tools/target/release/libmls* ./core/bin/
