async function startServer (id) {
  require('dotenv').config()
  require('newrelic')
  require('bugsnag').register(process.env.BUGSNAG_API_KEY)

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
    twilioAccount: process.env.TWILIO_ACCOUNT,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    boomtownSecret: process.env.BOOMTOWN_SECRET,
    port: process.env.PORT || 3000
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
