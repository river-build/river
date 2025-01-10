# Check if at least two arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <git_branch> <number_of_times>"
    exit 1
fi

# Extract arguments
branch=$1
shift

count=$1
shift

if git rev-parse --verify "$branch" >/dev/null 2>&1; then
  :
else
  echo "Git branch '$branch' does not exist."
  exit 1
fi

# Validate if count is a positive integer
if ! [[ "$count" =~ ^[0-9]+$ ]]; then
    echo "Error: <number_of_times> must be a positive integer."
    exit 1
fi

# Loop to run the command the specified number of times
# Edit true/false values below to enable or disable specific workflows of CI
# The default setting is running only go tests.
for ((i = 1; i <= count; i++)); do
    echo "Sending CI job..."
    echo '
    {
        "skip_common_ci":"true",
        "skip_multinode":"true",
        "skip_multinode_ent":"true",
        "skip_multinode_ent_legacy":"true",
        "skip_xchain_integration":"true",
        "skip_go":"false"
    }' | gh workflow run .github/workflows/ci.yml --ref $branch --json
done
