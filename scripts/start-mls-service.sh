#!/bin/bash
set -euo pipefail

cargo build --release --manifest-path ./mls/mls-tools/crates/service/Cargo.toml
# move to a name that we can killall
mv ./mls/mls-tools/target/release/service ./mls/mls-tools/target/release/mls_service
./mls/mls-tools/target/release/mls_service /tmp/mls_service &
