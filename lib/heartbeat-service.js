const assert = require('assert')

module.exports =
class HeartbeatService {
  constructor ({pubSubGateway, evictionPeriodInMilliseconds}) {
    this.pubSubGateway = pubSubGateway
    this.evictionPeriod = evictionPeriodInMilliseconds
    this.lastTimestamps = new Map()
  }

  reset () {
    this.lastTimestamps.clear()
  }

  keepAlive (portalId, siteId) {
    this.lastTimestamps.set(keyForPortalIdAndSiteId(portalId, siteId), Date.now())
  }

  // FIXME: If a site creates/joins a portal without ever sending a heartbeat, this method fails to evict that site
  evictDeadSites () {
    assert(this.evictionPeriod, 'You must set an eviction period!')

    const now = Date.now()
    for (const [key, timestamp] of this.lastTimestamps) {
      const {portalId, siteId} = portalIdAndSiteIdForKey(key)
      if (now - timestamp >= this.evictionPeriod) {
        this.pubSubGateway.broadcast(
          `/portals/${portalId}`,
          'disconnect-site',
          {text: JSON.stringify({siteId})}
        )
        this.lastTimestamps.delete(key)
      }
    }
  }

  setEvictionPeriod (period) {
    this.evictionPeriod = period
  }
}

function keyForPortalIdAndSiteId (portalId, siteId) {
  return `${portalId}.${siteId}`
}

function portalIdAndSiteIdForKey (key) {
  const [portalId, siteId] = key.split('.')
  return {portalId, siteId}
}
