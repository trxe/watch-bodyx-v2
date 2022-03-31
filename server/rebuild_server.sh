#!/bin/bash

docker stop server_bodyx-server_1
docker stop database_container
docker container prune
docker image rm server_bodyx-server
docker-compose up -d
docker container ls
docker logs server_bodyx-server_1