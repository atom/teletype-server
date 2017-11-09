# Deploying

Atom core team members can follow the instructions below to test pull requests and deploy changes to production.

## Testing pull requests

Visit the [atom-teletype pipeline dashboard](https://dashboard.heroku.com/pipelines/7b6e5b11-ca97-402a-8b3f-b48f2d1645cf) on Heroku.

![pipeline](https://user-images.githubusercontent.com/482957/32596993-87956fe4-c535-11e7-8d3a-651cf4348795.png)

In the left-hand column, you'll see a *review application* for each open pull request on this repository. Alternatively, you can also wait for a deployment notification to be displayed directly on the pull-request.

The teletype package can be instructed to use one of these servers by opening the package's settings page and assigning the base URL.

![package-settings](https://user-images.githubusercontent.com/482957/32597088-dd1907aa-c535-11e7-937e-ba254300fca3.png)

You'll need to reload the window for the change to take effect. You should not normally need to touch the Pusher key as we use the same Pusher account on both staging and production.

## Deploying

1. Ask @as-cii, @nathansobo, @jasonrudolph, or @iolsen to grant you deploy access on https://dashboard.heroku.com/apps/atom-teletype.

2. Visit the [atom-teletype pipeline dashboard](https://dashboard.heroku.com/pipelines/7b6e5b11-ca97-402a-8b3f-b48f2d1645cf) on Heroku.

3. Whenever someone pushes to `master`, its contents are automatically deployed to staging. Use the instructions from the [testing section](#testing-pull-requests) above with the base URL of `https://atom-teletype-staging.herokuapp.com/` if you'd like to test the Atom package against staging before deploying.

4. Once you're satisfied with your testing, click **Promote to production...** on the staging app to move the staging slug to the production app.

![promote-to-production](https://user-images.githubusercontent.com/482957/32597196-44b75ba0-c536-11e7-9c6d-92a4ebb85cfc.png)

## Chat-ops

You can also interact with our Heroku pipeline on Slack via ChatOps. Check out [this page](https://devcenter.heroku.com/articles/chatops) for more information.
