#!/bin/bash
set -euo pipefail

mkdir -p ./bin
cargo build --release --manifest-path ./mls/mls-tools/crates/mlslib/Cargo.toml
cp ./mls/mls-tools/target/release/libmls* ./core/node/mls_service/
cp ./mls/mls-tools/target/release/libmls* ./core
cp ./mls/mls-tools/target/release/libmls* ./bin
cp ./mls/mls-tools/target/release/libmls* ./

export CGO_LDFLAGS="./libmls_lib.a -ldl"
