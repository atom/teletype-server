const {StatusCodeError} = require('request-promise-core/lib/errors')

module.exports =
class KeycloakIdentityProvider {
  constructor ({request, apiUrl, clientId, clientSecret, realm}) {
    this.request = request
    this.apiUrl = apiUrl
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.realm = realm
  }

  make_base_auth(clientId, clientSecret) {
    var token = clientId + ':' + clientSecret
    var hash = Buffer.from(token).toString('base64')
    return "Basic " + hash
  }

  async identityForToken (oauthToken) {
    try {
      var options = {
        method: 'POST',
        uri: `${this.apiUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'api.teletype.atom.io',
          'Authorization': this.make_base_auth(this.clientId, this.clientSecret)
        },
        body: `token=${oauthToken}`
      }
      const response = await this.request(options)
      const user = JSON.parse(response)

      if (!user.active) {
        const error = new Error('Token not provided.')
        error.statusCode = 400
        throw error
      }
      return {id: user.sub, login: user.username}
    } catch (e) {
      let errorMessage, statusCode
      if (e instanceof StatusCodeError) {
        const error = JSON.parse(e.error)
        const description = (error.message != null) ? error.message : e.error
        errorMessage = `${this.apiUrl} responded with ${e.statusCode}: ${description}`
        statusCode = e.statusCode
      } else if (e instanceof Error) {
        errorMessage = `Failed to query ${this.apiUrl}: ${e.message}`
        statusCode = 400
      } else {
        errorMessage = `Failed to query ${this.apiUrl}: ${e.message}`
        statusCode = 500
      }

      const error = new Error(errorMessage)
      error.statusCode = statusCode
      throw error
    }
  }

  async isOperational () {
    try {
      var options = {
        method: 'POST',
        uri: `${this.apiUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'api.teletype.atom.io',
          'Authorization': this.make_base_auth(this.clientId, this.clientSecret)
        },
        body: `token=`
      }

      await this.request(options)
      return true
    } catch (e) {
      return false
    }
  }
}
