const assert = require('assert')
const ModelLayer = require('./model-layer')

module.exports =
class HeartbeatService {
  constructor ({modelLayer, pubSubGateway, evictionPeriodInMilliseconds}) {
    this.modelLayer = modelLayer
    this.pubSubGateway = pubSubGateway
    this.evictionPeriod = evictionPeriodInMilliseconds
  }

  keepAlive (portalId, siteId) {
    return this.modelLayer.keepAlive(portalId, siteId)
  }

  async evictDeadSites () {
    const deadSites = await this.findDeadSites()
    for (let i = 0; i < deadSites.length; i++) {
      const {portalId, id: siteId} = deadSites[i]
      this.pubSubGateway.broadcast(
        `/portals/${portalId}`,
        'site-connection-lost',
        {text: JSON.stringify({siteId})}
      )
      this.modelLayer.deleteSite(portalId, siteId)
    }
  }

  findDeadSites () {
    assert(this.evictionPeriod, 'You must set an eviction period!')
    return this.modelLayer.findDeadSites(this.evictionPeriod)
  }

  setEvictionPeriod (period) {
    this.evictionPeriod = period
  }
}
