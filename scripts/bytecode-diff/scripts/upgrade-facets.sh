#!/bin/bash
set -ueo pipefail
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
cd ..

# Check if a directory argument is provided, otherwise use the default
if [ $# -eq 0 ]; then
    diff_dir="deployed-diffs"
    file_name=""
elif [ $# -eq 1 ]; then
    diff_dir="$1"
    file_name=""
elif [ $# -eq 2 ]; then
    diff_dir="$1"
    file_name="$2"
else
    echo "Usage: $0 [diff_directory] [file_name]"
    exit 1
fi

# Function to process a single YAML file
process_file() {
    local file="$1"
    echo "Processing file: $file"

    # Extract originContractNames into an array, strip "Facet" suffix, and remove duplicates
    contract_names=($(yq e '.diamonds[].facets[].originContractName' "$file" | sed 's/Facet$//' | sort -u))

    # Determine which make command to use
    if [[ "$file" == *"to_omega"* ]]; then
        chain_id=8453
        context="omega"
        make_command="make deploy-base"
    elif [[ "$file" == *"to_gamma"* ]]; then
        chain_id=84532
        context="gamma"
        make_command="make deploy-base-sepolia"
    else
        echo "Error: Unknown file type $file. Cannot determine chain ID and context."
        exit 1
    fi

    # Loop through each contract name and call the appropriate make command
    if [ ${#contract_names[@]} -eq 0 ]; then
        echo "No contracts to deploy."
        exit 0
    else
        current_dir=$(pwd)
        cd ../../contracts
        for contract in "${contract_names[@]}"; do
            echo "Deploying contract: $contract to chain $chain_id with context $context"
            OVERRIDE_DEPLOYMENTS=1 $make_command context="$context" type=facets contract="Deploy$contract"
            
            # Check if the make command was successful
            if [ $? -ne 0 ]; then
                echo "Error deploying $contract"
            fi
        done
        cd "$current_dir"
    fi  # Add this line to close the if statement

    # Call process_deployments after processing the file
    process_deployments "$chain_id" "${contract_names[@]}"
}

# Function to process deployments and create a new YAML file
process_deployments() {
    local chain_id="$1"
    shift
    local contract_names=("$@")
    local current_date=$(date +%Y%m%d)
    local output_file="${diff_dir}/deployment_${current_date}.yaml"
    local suffix=1
    while [[ -f "$output_file" ]]; do
        output_file="${diff_dir}/deployment_${current_date}_${suffix}.yaml"
        ((suffix++))
    done

    echo "deployments:" > "$output_file"

    for contract in "${contract_names[@]}"; do
        local json_file="../../broadcast/Deploy${contract}.s.sol/${chain_id}/run-latest.json"
        if [[ -f "$json_file" ]]; then
            local contract_name=$(jq -r '.transactions[0].contractName' "$json_file")
            local contract_address=$(jq -r '.transactions[0].contractAddress' "$json_file")
            local tx_hash=$(jq -r '.transactions[0].hash' "$json_file")
            
            echo "  $contract_name:" >> "$output_file"
            echo "    address: $contract_address" >> "$output_file"
            echo "    transactionHash: $tx_hash" >> "$output_file"
        fi
    done

    echo "Deployment information saved to $output_file"
}

# Main script
if [ -n "$file_name" ]; then
    if [[ -f "$diff_dir/$file_name" ]]; then
        process_file "$diff_dir/$file_name"
    else
        echo "Error: Specified file $diff_dir/$file_name not found."
        exit 1
    fi
else
    for file in "$diff_dir"/diff_*.yaml; do
        if [[ -f "$file" ]]; then
            process_file "$file"
        fi
    done
fi