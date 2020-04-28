const {StatusCodeError} = require('request-promise-core/lib/errors')

module.exports =
class IdentityProvider {
  constructor ({request, apiUrl, clientId, clientSecret, oauthToken}) {
    this.request = request
    this.apiUrl = apiUrl
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.oauthToken = oauthToken
  }

  async identityForToken (oauthToken) {
    try {
      const headers = {
        'User-Agent': 'api.teletype.atom.io',
        'Authorization': `token ${oauthToken}`
      }
      const response = await this.request.get(this.apiUrl + '/user', {headers})
      const user = JSON.parse(response)
      return {id: user.id.toString(), login: user.login}
    } catch (e) {
      let errorMessage, statusCode
      if (e instanceof StatusCodeError) {
        const error = JSON.parse(e.error)
        const description = (error.message != null) ? error.message : e.error
        errorMessage = `${this.apiUrl} responded with ${e.statusCode}: ${description}`
        statusCode = e.statusCode
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
        headers: {'User-Agent': 'api.teletype.atom.io'}
      }

      if (this.clientId && this.clientSecret) {
        options.qs = {client_id: this.clientId, client_secret: this.clientSecret}
      } else if (this.oauthToken) {
        options.headers['Authorization'] = `bearer ${this.oauthToken}`
      }

      await this.request.get(`${this.apiUrl}`, options)
      return true
    } catch (e) {
      return false
    }
  }
}
