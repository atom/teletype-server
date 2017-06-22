const pgp = require('pg-promise')()
const HeartbeatService = require('./heartbeat-service')
const ModelLayer = require('./model-layer')
const PubSubGateway = require('./pusher-pub-sub-gateway')

module.exports =
class Evictor {
  constructor ({databaseURL, pusherAppId, pusherKey, pusherSecret, evictionPeriodInMilliseconds}) {
    this.evictionPeriodInMilliseconds = evictionPeriodInMilliseconds
    this.heartbeatService = new HeartbeatService({
      modelLayer: new ModelLayer({db: pgp(databaseURL)}),
      pubSubGateway: new PubSubGateway({
        appId: pusherAppId,
        key: pusherKey,
        secret: pusherSecret
      }),
      evictionPeriodInMilliseconds
    })
  }

  start () {
    setInterval(() => {
      this.heartbeatService.evictDeadSites()
    }, this.evictionPeriodInMilliseconds)
  }
}
