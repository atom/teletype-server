## Dependencies

- Node 7+
- PostgreSQL 9.x

## Running locally

1. Clone and bootstrap

    ```sh
    git clone https://github.com/atom/real-time-server.git ~/github/real-time-server
    cd ~/github/real-time-server
    cp .env.example .env
    createdb real-time-server-dev
    npm install
    npm run migrate up
    ```

2. Setup Pusher
  1. Ask @as-cii, @nathansobo, or @jasonrudolph to add you as a collaborator on the [tachyon-development app](https://dashboard.pusher.com/apps/348824).
  2. Copy [the key and secret from Pusher](https://dashboard.pusher.com/apps/348824/keys), and set those values in your `.env` file.

3. Start the server

    ```sh
    ./script/server
    ```

## Testing pull requests

Visit the [atom-tachyon pipeline dashboard](https://dashboard.heroku.com/pipelines/7b6e5b11-ca97-402a-8b3f-b48f2d1645cf) on Heroku.

![screen shot 2017-09-28 at 11 26 18 am](https://user-images.githubusercontent.com/1789/30981846-dc160a56-a442-11e7-89f8-21e379f91c96.png)

In the left-hand column, you'll see a *review application* for each open pull request on this repository.

Alternatively, you can also wait for a deployment notification to be displayed directly on the pull-request.

![screen shot 2017-09-29 at 12 18 54](https://user-images.githubusercontent.com/482957/31011960-649b70be-a510-11e7-9d7c-b8a5a3b8e630.png)

The real-time package can be instructed to use one of these servers by opening the package's settings page and assigning the base URL.

![screen shot 2017-09-28 at 11 46 08 am](https://user-images.githubusercontent.com/1789/30982114-b918d8ca-a443-11e7-83d3-65f0e35e99c3.png)

You'll need to reload the window for the change to take effect. You should not normally need to touch the Pusher key as we use the same Pusher account on both staging and production.

## Deploying

1. Ask @as-cii, @nathansobo, @jasonrudolph, or @iolsen to grant you deploy access on https://dashboard.heroku.com/apps/atom-tachyon.

2. Visit the [atom-tachyon pipeline dashboard](https://dashboard.heroku.com/pipelines/7b6e5b11-ca97-402a-8b3f-b48f2d1645cf) on Heroku.

3. Whenever someone pushes to `master`, its contents are automatically deployed to staging. Use the instructions from the [testing section](#Testing) above with the base URL of `https://atom-tachyon-staging.herokuapp.com/` if you'd like to test the Atom package against staging before deploying.

4. Once you're satisfied with your testing, click **Promote to production...** on the staging app to move the staging slug to the production app.

![screen shot 2017-09-28 at 11 51 43 am](https://user-images.githubusercontent.com/1789/30982049-8eef0d9e-a443-11e7-8e2b-bf143dbd24a4.png)
