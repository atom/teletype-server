const buildControllerLayer = require('./controller-layer')
const pgp = require('pg-promise')()
const ModelLayer = require('./model-layer')
const PubSubGateway = require('./pusher-pub-sub-gateway')

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
    const modelLayer = new ModelLayer({db: pgp(this.databaseURL)})
    const pubSubGateway = new PubSubGateway({
      appId: this.pusherAppId,
      key: this.pusherKey,
      secret: this.pusherSecret
    })
    const controllerLayer = buildControllerLayer({
      modelLayer,
      pubSubGateway
    })

    return new Promise((resolve) => {
      this.server = controllerLayer.listen(this.port, resolve)
    })
  }

  stop () {
    return new Promise((resolve) => this.server.close(resolve))
  }
}
