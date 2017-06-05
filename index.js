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
