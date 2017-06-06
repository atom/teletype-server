module.exports =
class Server {
  constructor ({databaseURL, pusherAppId, pusherKey, pusherSecret, port}) {
    this.databaseURL = databaseURL
    this.pusherAppId = pusherAppId
    this.pusherKey = pusherKey
    this.pusherSecret = pusherSecret
    this.port = port
  }

  start () {
    const pgp = require('pg-promise')()
    const buildControllerLayer = require('./controller-layer')
    const PubSubGateway = require('./pusher-pub-sub-gateway')

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
