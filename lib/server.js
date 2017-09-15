const buildControllerLayer = require('./controller-layer')
const pgp = require('pg-promise')()
const request = require('request-promise-native')
const ICEServerRegistry = require('./ice-server-registry')
const IdentityProvider = require('./identity-provider')
const ModelLayer = require('./model-layer')
const PubSubGateway = require('./pusher-pub-sub-gateway')

module.exports =
class Server {
  constructor ({databaseURL, pusherAppId, pusherKey, pusherSecret, twilioAccount, twilioAuthToken, port}) {
    this.databaseURL = databaseURL
    this.pusherAppId = pusherAppId
    this.pusherKey = pusherKey
    this.pusherSecret = pusherSecret
    this.twilioAccount = twilioAccount
    this.twilioAuthToken = twilioAuthToken
    this.port = port
  }

  async start () {
    const modelLayer = new ModelLayer({db: pgp(this.databaseURL)})
    const identityProvider = new IdentityProvider({request})
    const pubSubGateway = new PubSubGateway({
      appId: this.pusherAppId,
      key: this.pusherKey,
      secret: this.pusherSecret
    })

    const iceServerRegistry = new ICEServerRegistry({
      request,
      twilioAccount: this.twilioAccount,
      twilioAuthToken: this.twilioAuthToken
    })

    const controllerLayer = buildControllerLayer({
      modelLayer,
      pubSubGateway,
      identityProvider,
      iceServerRegistry,
    })

    return new Promise((resolve) => {
      this.server = controllerLayer.listen(this.port, resolve)
    })
  }

  stop () {
    return new Promise((resolve) => this.server.close(resolve))
  }
}
