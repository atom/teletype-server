module.exports =
class IdentityProvider {
  constructor ({request}) {
    this.request = request
  }

  // TODO Handle other failure types (e.g., rate limiting error, api.github.com inaccessible)
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
      const error = JSON.parse(e.error)
      const description = (error.message != null) ? error.message : e.error
      const reason = `GitHub API responded with ${e.statusCode}: ${description}`
      return Promise.reject(reason)
    }
  }
}
