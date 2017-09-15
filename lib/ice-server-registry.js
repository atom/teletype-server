const cache = require('memory-cache')

const CACHE_KEY = 'servers'

module.exports =
class ICEServerRegistry {
  constructor ({request, twilioAccount, twilioAuthToken}) {
    this.request = request
    this.twilioICEServerURL = `https://${twilioAccount}:${twilioAuthToken}@api.twilio.com/2010-04-01/Accounts/${twilioAccount}/Tokens.json`
  }

  async getServers () {
    let servers = cache.get(CACHE_KEY)

    if (servers == null) {
      const response = JSON.parse(await this.request.post(this.twilioICEServerURL))
      const ttl = parseInt(response.ttl)
      servers = response.ice_servers
      cache.put(CACHE_KEY, servers, ttl)
    }

    return servers
  }
}
