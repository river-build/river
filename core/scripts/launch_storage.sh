#!/bin/bash -ue
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"

echo 
echo "Launching Postgres..."
echo 

docker compose pull
docker compose --project-name river up --detach --wait
