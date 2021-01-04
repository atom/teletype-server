async function startServer (id) {
  require('dotenv').config()
  require('newrelic')

  const bugsnag = require('bugsnag')
  bugsnag.register(process.env.BUGSNAG_API_KEY)

  process.on('unhandledRejection', (error) => {
    console.error(error.stack)
    bugsnag.notify(error)
  })

  const Server = require('./lib/server')
  const server = new Server({
    databaseURL: process.env.DATABASE_URL,
    pusherAppId: process.env.PUSHER_APP_ID,
    pusherKey: process.env.PUSHER_KEY,
    pusherSecret: process.env.PUSHER_SECRET,
    pusherCluster: process.env.PUSHER_CLUSTER || "mt1",
    twilioAccount: process.env.TWILIO_ACCOUNT,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    githubApiUrl: process.env.GITHUB_API_URL || "https://api.github.com",
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubOauthToken: process.env.GITHUB_OAUTH_TOKEN,
    keycloakApiUrl: process.env.KEYCLOAK_API_URL,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    keycloakRealm: process.env.KEYCLOAK_REALM,
    boomtownSecret: process.env.BOOMTOWN_SECRET,
    hashSecret: process.env.HASH_SECRET,
    port: process.env.PORT || 3000,
    coturnUsername: process.env.COTURN_USERNAME,
    coturnPassword: process.env.COTURN_PASSWORD,
    activePubSubGateway: process.env.ACTIVE_PUB_SUB_GATEWAY,
    activeIceServerProvider: process.env.ACTIVE_ICE_SERVER_PROVIDER,
    activeIdentityProvider: process.env.ACTIVE_IDENTITY_PROVIDER
  })
  await server.start()
  console.log(`Worker ${id} (pid: ${process.pid}): listening on port ${server.port}`)
  return server
}

async function startTestServer (params) {
  const TestServer = require('./lib/test-server')
  const server = new TestServer(params)
  await server.start()
  return server
}

module.exports = {startServer, startTestServer}
