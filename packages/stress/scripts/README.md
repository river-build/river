# Running stress locally via Docker

NOTE: experimental setting for host network needs to be enabled in Docker Desktop for Mac

Copy `river-ca-cert.pem` from `~` to root of the repo.
Then run `run_multi.sh -c -r"
Then it's possible to build and run the image:

    ./packages/stress/scripts/docker_stress_local_build.sh
    ./packages/stress/scripts/docker_stress_local_run.sh
