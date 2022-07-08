# BODYX

A platform for digital theatre, supporting:
(insert gallery here for each point)

- Realtime events control
- Seamless transition between streams for users
- Live group chat and private chat with event administrators

## Getting started (running locally)

Requirements: Node.js (npm), MongoDB

After forking the repository, do the following steps to setup 
BODYX on your own device:

1. Clone and install the relevant packages.
    ```
    $ git clone https://github.com/yourusername/watch-bodyx-v2.git
    $ cd client
    $ npm install
    $ cd ../server
    $ npm install
    ```
2. Setup the following two files as below, replacing the variables as necessary:

    ./server/.env:
    ```
    PORT=4000
    HOST=0.0.0.0
    DB_URL=mongodb://127.0.0.1:27017
    DB_NAME=bodyx
    EVENTBRITE_API_KEY=MY_3VEN+BR1T3_K3Y
    SMTP_HOST=host.name
    SMTP_EMAIL=youremailaddress@host.name
    SMTP_PWD=dummypassword
    ```

    ./client/.env.local:
    ```
    NEXT_PUBLIC_URL=http://localhost:4000
    ```

## Getting started (deploying to server)

Requirements: Docker with node.js and mongo images

1. Clone your fork and install the relevant packages

    ```
    $ git clone https://github.com/yourusername/watch-bodyx-v2.git
    $ cd client
    $ npm install
    $ cd ../server
    $ npm install
    ```
2. Setup the following two files as below, replacing the variables as necessary:

    ./server/.env:
    ```
    PORT=4000
    HOST=0.0.0.0
    DB_URL=mongodb://127.0.0.1:27017
    DB_NAME=bodyx
    EVENTBRITE_API_KEY=MY_3VEN+BR1T3_K3Y
    SMTP_HOST=host.name
    SMTP_EMAIL=ticketingemail@host.name
    SMTP_PWD=dummypassword
    ```

    ./client/.env.local:
    ```
    NEXT_PUBLIC_URL=https://yourcustom.domain.com
    ```
3. Run the following commands to start the docker images

    ```
    $ cd client
    $ docker run -d -p 3000:3000 --name client_bodyx-client bodyx-client
    $ cd ../server
    $ docker-compose up -d
    ```
4. Setup the relevant reverse proxy server (I used NGINX) and SSL certificates
5. Start the server and access your website!

## Basic dev guide

Coming soon. Codebase is a mess right now but will be adding
JSDoc and inline comments.