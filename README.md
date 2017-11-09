# teletype-server

## Hacking

### Dependencies

To run teletype-server locally, you'll first need to have:

- Node 7+
- PostgreSQL 9.x
- An app on [pusher.com](https://pusher.com/docs/javascript_quick_start#get-your-free-API-keys)

## Running locally

1. Clone and bootstrap

    ```sh
    git clone https://github.com/atom/teletype-server.git
    cd teletype-server
    cp .env.example .env
    createdb teletype-server-test
    npm install
    npm run migrate up
    ```

2. Copy the `app_id`, `key`, and `secret` for your app on pusher.com, and set those values in your `.env` file.

3. Start the server

    ```sh
    ./script/server
    ```

4. Run the tests

    ```sh
    npm test
    ```

## Testing pull requests

Visit the [atom-teletype pipeline dashboard](https://dashboard.heroku.com/pipelines/7b6e5b11-ca97-402a-8b3f-b48f2d1645cf) on Heroku.

![screen shot 2017-11-09 at 10 05 13](https://user-images.githubusercontent.com/482957/32596993-87956fe4-c535-11e7-8d3a-651cf4348795.png)

In the left-hand column, you'll see a *review application* for each open pull request on this repository. Alternatively, you can also wait for a deployment notification to be displayed directly on the pull-request.

The teletype package can be instructed to use one of these servers by opening the package's settings page and assigning the base URL.

![screen shot 2017-11-09 at 10 07 50](https://user-images.githubusercontent.com/482957/32597088-dd1907aa-c535-11e7-937e-ba254300fca3.png)

You'll need to reload the window for the change to take effect. You should not normally need to touch the Pusher key as we use the same Pusher account on both staging and production.

## Deploying

1. Ask @as-cii, @nathansobo, @jasonrudolph, or @iolsen to grant you deploy access on https://dashboard.heroku.com/apps/atom-teletype.

2. Visit the [atom-teletype pipeline dashboard](https://dashboard.heroku.com/pipelines/7b6e5b11-ca97-402a-8b3f-b48f2d1645cf) on Heroku.

3. Whenever someone pushes to `master`, its contents are automatically deployed to staging. Use the instructions from the [testing section](#Testing) above with the base URL of `https://atom-teletype-staging.herokuapp.com/` if you'd like to test the Atom package against staging before deploying.

4. Once you're satisfied with your testing, click **Promote to production...** on the staging app to move the staging slug to the production app.

![screen shot 2017-11-09 at 10 09 30](https://user-images.githubusercontent.com/482957/32597196-44b75ba0-c536-11e7-9c6d-92a4ebb85cfc.png)

## Chat-ops

You can also interact with our Heroku pipeline on Slack via ChatOps. Check out [this page](https://devcenter.heroku.com/articles/chatops) for more information.
