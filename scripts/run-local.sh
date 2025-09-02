#!/usr/bin/env bash

set -eu

# Stop and remove the client container
docker-compose stop client
docker-compose rm -f client

# Start the db service if it's not already running
if ! docker-compose ps db | grep -q 'Up'; then
  docker-compose up --build -d db
fi

# Start the db-test service if it's not already running
if ! docker-compose ps db-test | grep -q 'Up'; then
  docker-compose up --build -d db-test
fi

# Build and start the client service
docker-compose up --build client