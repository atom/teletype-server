module.exports =
class Server {
  constructor ({databaseURL, pusherAppId, pusherKey, pusherSecret, port, maxMessageSizeInBytes}) {
    this.databaseURL = databaseURL
    this.pusherAppId = pusherAppId
    this.pusherKey = pusherKey
    this.pusherSecret = pusherSecret
    this.port = port
    this.maxMessageSizeInBytes = maxMessageSizeInBytes
  }

  start () {
    const pgp = require('pg-promise')()

    const PubSubGateway = require('./pusher-pub-sub-gateway')
    const pubSubGateway = new PubSubGateway({
      appId: this.pusherAppId,
      key: this.pusherKey,
      secret: this.pusherSecret
    })

    const HeartbeatService = require('./heartbeat-service')
    const heartbeatService = new HeartbeatService({pubSubGateway})

    const buildControllerLayer = require('./controller-layer')
    const controllerLayer = buildControllerLayer({
      db: pgp(this.databaseURL),
      maxMessageSizeInBytes: this.maxMessageSizeInBytes,
      pubSubGateway,
      heartbeatService
    })

    return new Promise((resolve) => {
      this.server = controllerLayer.listen(this.port, resolve)
    })
  }

  stop () {
    return new Promise((resolve) => this.server.close(resolve))
  }
}
