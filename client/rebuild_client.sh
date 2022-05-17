#!/bin/bash

docker stop client_bodyx-client
docker container prune
docker image rm bodyx-client
docker build -t bodyx-client .
docker run -d -p 3000:3000 --name client_bodyx-client bodyx-client
docker container ls