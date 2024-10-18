#!/bin/bash

# URL to be called
URL="http://localhost:3002/media/ff1aef42c5e804f04be05f1ecacf76c04d3e62093964e4cbc0f5c3a784139d91?key=8146f06f94d1c58ed193a71cda306dd0e0a427076b388ee3ae281b58dc25084f&iv=b27ff3cf8b4c4f43ce51fb78"

# Number of concurrent processes
CONCURRENCY=64

# Function to make the curl call
make_call() {
    while true; do
        curl -s "$URL" > /dev/null
        echo "Request completed"
    done
}

# Start the concurrent processes
for ((i=1; i<=CONCURRENCY; i++))
do
    make_call &
    echo "Started process $i"
done

# Wait for user input to stop
echo "Press Enter to stop the script"
read

# Kill all background processes
kill $(jobs -p)

echo "All processes terminated"