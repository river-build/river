#!/bin/bash -ue

pushd ../../../mls/mls-tools > /dev/null
cargo build --release
popd > /dev/null
