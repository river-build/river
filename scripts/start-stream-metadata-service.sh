#!/bin/bash

# Initialize variables
RIVER_ENV=""
RIVER_ROOT=""

# Function to display usage information
usage() {
    echo "Usage: $0 [-r <root_directory>] [-e <environment>]"
    echo "  -r <root_directory>   Set the root directory for the project."
    echo "  -e <environment>      Set the RIVER_ENV variable in the .env.local file."
    exit 1
}

# Parse command-line arguments
while getopts "r:e:h" opt; do
  case $opt in
    r) RIVER_ROOT="$OPTARG" ;;
    e) RIVER_ENV="$OPTARG" ;;
    h) usage ;;  # Display usage information
    \?) echo "Invalid option: -$OPTARG" >&2; usage ;;
  esac
done

# Set RIVER_ROOT based on whether an argument is provided
if [ -z "$RIVER_ROOT" ]; then
    # Determine the Git project root if not provided
    RIVER_ROOT=$(git rev-parse --show-toplevel)
fi

RUN_DIR="$RIVER_ROOT/packages/stream-metadata"

echo "Starting stream-metadata service in $RUN_DIR"

# Try to change to RUN_DIR
# print an error if it fails, and exit
if ! pushd "$RUN_DIR"; then
    echo "Error: Failed to change directory to $RUN_DIR"
    exit 1
fi

# Copy the sample env file to .env.local
cp ./.env.local-sample ./.env.local

# Start the development server with the specified environment
if [ -n "$RIVER_ENV" ]; then
    yarn dev:"$RIVER_ENV"
else
    yarn dev
fi
