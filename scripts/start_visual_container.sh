#!/bin/bash

# Starts the playwright container used for visual testing
# Ensure your docker daemon is running

PW_VERSION=v1.49.1-noble
DOCKER_PW_IMAGE="mcr.microsoft.com/playwright:${PW_VERSION}"

docker run --rm \
  --network host \
  --ipc=host \
  -v "$(pwd)":/playwright/ \
  -w /playwright/ \
  -it $DOCKER_PW_IMAGE \
  /bin/bash -c "\
    npm install --global yarn && \
    yarn cache clean && \
    yarn install && \
    yarn playwright install --with-deps && \
    yarn playwright install chrome && \
    bash"
