module.exports =
class IdentityProvider {
  constructor ({request}) {
    this.request = request
  }

  // TODO Handle failed request
  async getUser (oauthToken) {
    const headers = {
      'User-Agent': 'atom-tachyon.herokuapp.com',
      'Authorization': `token ${oauthToken}`
    }
    const response = await this.request.get('https://api.github.com/user', {headers})
    const user = JSON.parse(response)
    return {username: user.login}
  }
}
