const assert = require('assert')
const ICEServerRegistry = require('../lib/ice-server-registry')

suite('ICEServerRegistry', () => {
  test('fetching, caching, and returning ICE servers', async () => {
    const servers = [
      {
        url: 'some-url',
        username: 'some-username',
        credential: 'some-credential'
      }
    ]

    let apiRequestCount = 0
    const request = {
      post: async function (url) {
        apiRequestCount++
        return JSON.stringify({ttl: '86400', ice_servers: servers})
      }
    }

    const registry = new ICEServerRegistry({request})

    // initial request fetches servers from Twilio API
    assert.deepEqual(await registry.getServers(), servers)
    assert.equal(apiRequestCount, 1)

    // subsequent requests fetch servers from cache
    assert.deepEqual(await registry.getServers(), servers)
    assert.equal(apiRequestCount, 1)
  })
})
