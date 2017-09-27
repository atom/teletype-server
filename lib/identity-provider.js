const {StatusCodeError} = require('request-promise-core/lib/errors')

module.exports =
class IdentityProvider {
  constructor ({request, clientId, clientSecret}) {
    this.request = request
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async identityForToken (oauthToken) {
    try {
      const headers = {
        'User-Agent': 'atom-tachyon.herokuapp.com',
        'Authorization': `token ${oauthToken}`
      }
      const response = await this.request.get('https://api.github.com/user', {headers})
      const user = JSON.parse(response)
      return {username: user.login}
    } catch (e) {
      let errorMessage
      if (e instanceof StatusCodeError) {
        const error = JSON.parse(e.error)
        const description = (error.message != null) ? error.message : e.error
        errorMessage = `GitHub API responded with ${e.statusCode}: ${description}`
      } else {
        errorMessage = `Failed to query GitHub API: ${e.message}`
      }

      throw new Error(errorMessage)
    }
  }

  async isOperational () {
    try {
      await this.request.get(`https://api.github.com/users/octocat`, {
        headers: {'User-Agent': 'atom-tachyon.herokuapp.com'},
        qs: {client_id: this.clientId, client_secret: this.clientSecret}
      })
      return true
    } catch (e) {
      return false
    }
  }
}
