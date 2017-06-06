function startServer () {
  process.on('unhandledRejection', (reason) => {
    console.error(reason.stack)
  })

  require('dotenv').config()

  const pgp = require('pg-promise')()
  const buildControllerLayer = require('../lib/controller-layer')
  const PubSubGateway = require('../lib/pusher-pub-sub-gateway')

  const controllerLayer = buildControllerLayer({
    db: pgp(process.env.DATABASE_URL),
    pubSubGateway: new PubSubGateway({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET
    })
  })

  controllerLayer.listen(process.env.PORT || 3000)
}

function startTestServer ({databaseURL}) {
  // Migrate the database
  const path = require('path')
  const childProcess = require('child_process')

  const pgMigratePath = path.join(__dirname, 'node_modules', '.bin', 'pg-migrate')
  const migrateUpResult = childProcess.spawnSync(
    pgMigratePath,
    ['up', '--migrations-dir', path.join(__dirname, 'migrations')],
    {env: Object.assign({DATABASE_URL: databaseURL}, process.env)}
  )
  if (migrateUpResult.status !== 0) {
    throw new Error('Error running migrations:\n\n' + migrateUpResult.output)
  }

  // Start the server on a domain socket
  const temp = require('temp')

  // const pgp = require('pg-promise')()
  // db = pgp(databaseURL)
}

module.exports = {startServer, startTestServer}
