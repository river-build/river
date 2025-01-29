docker build \
  --build-arg GIT_SHA=abc \
  -f ./packages/xchain-monitor/Dockerfile \
  .