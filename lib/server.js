const buildControllerLayer = require('./controller-layer')
const pgp = require('pg-promise')()
const request = require('request-promise-native')
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
    const pubSubGateway = new PubSubGateway({
      appId: this.pusherAppId,
      key: this.pusherKey,
      secret: this.pusherSecret
    })

    const twilioICEServerURL = `https://${this.twilioAccount}:${this.twilioAuthToken}@api.twilio.com/2010-04-01/Accounts/${this.twilioAccount}/Tokens.json`

    const controllerLayer = buildControllerLayer({
      modelLayer,
      pubSubGateway,
      fetchICEServers: async () => {
        return JSON.parse(await request.post(twilioICEServerURL)).ice_servers
      }
    })

    return new Promise((resolve) => {
      this.server = controllerLayer.listen(this.port, resolve)
    })
  }

  stop () {
    return new Promise((resolve) => this.server.close(resolve))
  }
}
