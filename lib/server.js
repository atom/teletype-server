module.exports =
class Server {
  constructor ({databaseURL, pusherAppId, pusherKey, pusherSecret, port}) {
    this.databaseURL = databaseURL
    this.pusherAppId = pusherAppId
    this.pusherKey = pusherKey
    this.pusherSecret = pusherSecret
    this.port = port || 3000
  }

  start () {
    const pgp = require('pg-promise')()
    const buildControllerLayer = require('./lib/controller-layer')
    const PubSubGateway = require('./lib/pusher-pub-sub-gateway')

    const controllerLayer = buildControllerLayer({
      db: pgp(this.databaseURL),
      pubSubGateway: new PubSubGateway({
        appId: this.pusherAppId,
        key: this.pusherKey,
        secret: this.pusherSecret
      })
    })

    return new Promise((resolve) => {
      this.server = controllerLayer.listen(this.port, resolve)
    })
  }

  stop () {
    return new Promise((resolve) => this.server.close(resolve))
  }
}
