const {StatusCodeError} = require('request-promise-core/lib/errors')

module.exports =
class IdentityProvider {
  constructor ({request}) {
    this.request = request
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
      const readOnlyToken = '9baebb1c76fb37fcb0986fb979a46e1ff0c23441'
      const headers = {'User-Agent': 'atom-tachyon.herokuapp.com'}
      await this.request.get(`https://x-auth:${readOnlyToken}@api.github.com/user`, {headers})
      return true
    } catch (e) {
      return false
    }
  }
}
