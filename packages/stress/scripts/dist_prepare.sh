#!/bin/bash
set -euo pipefail
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
cd ..



# Define the directory
dist_dir="dist"

# Check if the directory exists
if [ -d "$dist_dir" ]; then
    # Delete all *.wasm files in the directory
    find "$dist_dir" -type f -name "*.wasm" -exec rm {} +
    echo "All *.wasm files have been deleted from $dist_dir."
else
    echo "Directory $dist_dir does not exist."
fi