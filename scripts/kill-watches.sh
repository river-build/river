#!/bin/bash
set -uo pipefail

echo 'scripts/kill-watches.sh'
watch_processes=$(ps -ax | grep 'yarn watch' | grep -v 'grep yarn watch' | awk '{print $1}')

if [ -n "$watch_processes" ]; then
    echo "killing watches $watch_processes"
    kill -- $watch_processes
else
    echo 'no watches to kill'
fi