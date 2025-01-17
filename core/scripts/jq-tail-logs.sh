#!/usr/bin/env bash
#
# tail-json-logs.sh
#
# Continuously tail a JSON log file. For each line:
#  - Parse with jq
#  - Add some formatting
#  - Print formatted output in real time

# Usage: ./tail-json-logs.sh /path/to/json.log

LOGFILE="$1"

if [[ -z "$LOGFILE" ]]; then
  echo "Usage: $0 /path/to/json.log"
  exit 1
fi

# A small jq function that picks a color based on the .level value
# (Extend this list as you like for other levels like DEBUG, TRACE, etc.)
read -r -d '' JQ_SCRIPT <<'EOF'
def c_reset:   "\u001b[0m";
def c_bold:       "\u001b[1m";
def c_green:   "\u001b[32m";
def c_yellow:  "\u001b[33m";
def c_red:     "\u001b[31m";
def c_blue:    "\u001b[34m";
def c_teal:     "\u001b[38;2;0;200;200m";

def colorLevel(l):
  if l == "INFO"  then c_green
  elif l == "WARN"  then c_yellow
  elif l == "ERROR" then c_red
  elif l == "DEBUG" then c_blue
  else c_reset
  end;

# Transform logic:
# - Print timestamp in white
# - Print level in color
# - Print message in white
# - Fallback to "N/A" if field is missing
# Fields we want on the single colored line
def standard_fields: ["timestamp", "level", "msg"];

def is_json:
  type == "object";

# For each JSON object in the stream
(
# 1) Print the standard fields in color
  c_bold + (.timestamp // "N/A") + c_reset + " " +
  colorLevel(.level) + "[" + (.level // "N/A") + "]" + c_teal + " => " + 
  c_reset + (.msg // "")
),
(
  to_entries | 
  map(select(.key as $k | standard_fields | contains([$k]) | not)) |
  .[] |
if .value | is_json then
  # For JSON values, output the key and then the pretty-printed value
  c_red + "  \(.key):" + c_reset, .value
else
  # For primitive values, output as a single JSON array
  c_red + "  \(.key):" + c_reset + " \(.value)"
end
),
""
EOF

# Use tail -f to follow the file, 
# pipe each line into jq in "unbuffered" mode:
#   --unbuffered : flush output after each line
#   -r           : raw output (don’t wrap strings in quotes)
#   -c           : compact output (not strictly needed, but can help performance)
#
# The `|| true` at the end ensures the script doesn’t exit if jq fails on a malformed line.
tail -n 500 -F "$LOGFILE" \
  | jq --unbuffered -r "$JQ_SCRIPT" || true
