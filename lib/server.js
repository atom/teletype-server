const buildControllerLayer = require('./controller-layer')
const pgp = require('pg-promise')()
const request = require('request-promise-native')
const IdentityProvider = require('./identity-provider')
const ModelLayer = require('./model-layer')
const PusherPubSubGateway = require('./pusher-pub-sub-gateway')
const SocketClusterPubSubGateway = require('./socketcluster-pub-sub-gateway')
const TwilioIceServerProvider = require('./twilio-ice-server-provider')
const CoturnIceServerProvider = require('./coturn-ice-server-provider')

module.exports =
class Server {
  constructor (options) {
    this.databaseURL = options.databaseURL
    this.pusherAppId = options.pusherAppId
    this.pusherKey = options.pusherKey
    this.pusherSecret = options.pusherSecret
    this.pusherCluster = options.pusherCluster
    this.twilioAccount = options.twilioAccount
    this.twilioAuthToken = options.twilioAuthToken
    this.githubApiUrl = options.githubApiUrl
    this.githubClientId = options.githubClientId
    this.githubClientSecret = options.githubClientSecret
    this.githubOauthToken = options.githubOauthToken
    this.boomtownSecret = options.boomtownSecret
    this.hashSecret = options.hashSecret
    this.port = options.port,
    this.coturnUsername = options.coturnUsername,
    this.coturnPassword = options.coturnPassword,
    this.activePubSubGateway = options.activePubSubGateway,
    this.activeIceServerProvider = options.activeIceServerProvider
  }

  async start () {
    const modelLayer = new ModelLayer({db: pgp(this.databaseURL), hashSecret: this.hashSecret})
    const identityProvider = new IdentityProvider({
      request,
      apiUrl: this.githubApiUrl,
      clientId: this.githubClientId,
      clientSecret: this.githubClientSecret,
      oauthToken: this.githubOauthToken
    })

    var pubSubGateway

    switch(this.activePubSubGateway) {
        case 'socketcluster':
            pubSubGateway = new SocketClusterPubSubGateway({})
            break;

        case 'pusher':
        default:
            pubSubGateway = new PusherPubSubGateway({
              appId: this.pusherAppId,
              key: this.pusherKey,
              secret: this.pusherSecret,
              cluster: this.pusherCluster
            })
            break;
    }

    var iceServerProvider
    switch(this.activeIceServerProvider) {
        case 'coturn':
            iceServerProvider = new CoturnIceServerProvider({
                coturnUsername: this.coturnUsername,
                coturnPassword: this.coturnPassword
            })
            break;

        case 'twilio':
        default:
            iceServerProvider = new TwilioIceServerProvider({
                twilioAccount: this.twilioAccount,
                twilioAuthToken: this.twilioAuthToken
            })
            break;
    }

    const controllerLayer = buildControllerLayer({
      modelLayer,
      pubSubGateway,
      identityProvider,
      boomtownSecret: this.boomtownSecret,
      fetchICEServers: async () => {
        iceServerProvider.fetchICEServers()
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
