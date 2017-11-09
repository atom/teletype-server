# teletype-server

The server-side application that facilitates peer discovery for collaborative editing sessions in [Teletype](https://github.com/atom/teletype).

## Hacking

### Dependencies

To run teletype-server locally, you'll first need to have:

- Node 7+
- PostgreSQL 9.x
- An app on [pusher.com](https://pusher.com/docs/javascript_quick_start#get-your-free-API-keys)

### Running locally

1. Clone and bootstrap

    ```
    git clone https://github.com/atom/teletype-server.git
    cd teletype-server
    cp .env.example .env
    createdb teletype-server-test
    npm install
    npm run migrate up
    ```

2. Copy the `app_id`, `key`, and `secret` for your app on pusher.com, and set those values in your `.env` file

3. Start the server

    ```
    ./script/server
    ```

4. Run the tests

    ```
    npm test
    ```

## Deploying

Atom core team members can use [this guide](./docs/deployment.md) to test pull requests and deploy changes to production.
