#!/bin/bash
set -euo pipefail
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
cd ..


# Define the directory
dist_dir="dist"

# Check if the directory exists
if [ -d "$dist_dir" ]; then
    # Find the file matching the pattern 'olm-*.wasm' and copy it to 'olm.wasm'
    for file in "$dist_dir"/olm-*.wasm; do
        # Check if the file actually exists (in case the glob didn't match anything)
        if [ -f "$file" ]; then
            cp "$file" "$dist_dir/olm.wasm"
            echo "Copied $file to $dist_dir/olm.wasm"
            break  # Remove this if you want to handle multiple files
        else
            echo "No files found matching the pattern 'olm-*.wasm'"
        fi
    done
else
    echo "Directory $dist_dir does not exist."
fi
