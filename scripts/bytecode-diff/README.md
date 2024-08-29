# Bytecode-Diff Tool

Bytecode-Diff is a tool to retrieve and display contract bytecode diff for Base deployed contracts and Solidity source compiled bytecode compiled with forge. It provides functionality to run source code diffs and create reports that detail changes in Solidity source code and deployed bytecode between two compiled bytecode versions and two deployed bytecode versions across different networks.

## Prerequisites

- Go 1.22 or later
- Base RPC Provider URL

## Usage

The basic command structure is:

```bash
# disable go.work file since bytecode-diff is not a module in parent go workspace
go mod download
# run source diff from checked out commitSha compared nearest commit with a source diff report in SOURCE_DIFF_DIR
GOWORK=off go run main.go -v -s

# write report with contract addresses, their keccak256 compilaed bytecode hash under two keys, existing and updated.
➜  bytecode-diff ✗ yq eval '.existing' source-diffs/00adc44f_08292024_5.yaml
Architect: 0xd291e489716f2c9cfc2e2c6047ce777159969943c85d09c51aaf7bbad10f7c13
ArchitectBase: 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
ArchitectStorage: 0x86159d997458669c4df8af2da4b5ce9ca742099a3f854c5eb3e718e16a74e4da
Banning: 0xde1354882fd30088cce4b00ff720a6dbc8c9f25653477c6ee99e20e17edb6068
BanningBase: 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
BanningStorage: 0x86159d997458669c4df8af2da4b5ce9ca742099a3f854c5eb3e718e16a74e4da
ChannelBase: 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
...
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
  --source-diff-dir /path/to/source-diff-reports \
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
