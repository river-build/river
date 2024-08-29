# Bytecode-Diff Tool

Bytecode-Diff is a tool to retrieve and display contract bytecode diff for Base deployed contracts and Solidity source compiled bytecode compiled with forge. It provides functionality to run source code diffs and create reports that detail changes in Solidity source code and deployed bytecode between two compiled bytecode versions and two deployed bytecode versions across different networks.

## Prerequisites

- Go 1.21 or later
- Base RPC Provider URL

## Usage

The basic command structure is:

```bash
# disable go.work file since bytecode-diff is not a module in parent go workspace
go mod download
GOWORK=off go run main.go
```

### Flags

- `-r, --rpc`: Base RPC provider URL
- `-s, --source-diff-only`: Run Solidity source code diff
- `--source-diff-log`: Path to source diff log file
- `--compiled-facets`: Path to compiled facets
- `--facets`: Path to facet source files
- `-v, --verbose`: Enable verbose output
- `--report-out-dir`: Path to report output directory

### Environment Variables

You can also set the following environment variables instead of using flags:

- `BASE_RPC_URL`: Base RPC provider URL
- `SOURCE_DIFF_DIR`: Path to source diff reports
- `FACET_SOURCE_PATH`: Path to facet source files
- `COMPILED_FACETS_PATH`: Path to compiled facets
- `REPORT_OUT_DIR`: Path to report output directory

## Examples

1. Run source code diff with all parameters specified via flags:

```
./bytecode-diff --source-diff-only \
  --rpc https://base-rpc.example.com \
  --source-diff-dir /path/to/alph-reports \
  --facets /path/to/facet/sources \
  --compiled-facets /path/to/compiled/facets \
  --report-out-dir /path/to/report/output \
  --verbose
```

2. Run source code diff using environment variables:

```
export BASE_RPC_URL=https://base-rpc.example.com
export SOURCE_DIFF_DIR=/path/to/source_diff.log
export FACET_SOURCE_PATH=/path/to/facet/sources
export COMPILED_FACETS_PATH=/path/to/compiled/facets
export REPORT_OUT_DIR=/path/to/report/output

./bytecode-diff -s --verbose
```

## Notes

- If a `.env` file is present in the same directory as the script, it will be loaded automatically.
- When running source code diff, all required paths must be provided either via flags or environment variables.
- Use the `--verbose` flag for more detailed output during execution.
