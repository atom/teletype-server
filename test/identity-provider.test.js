const assert = require('assert')
const IdentityProvider = require('../lib/identity-provider')

suite('IdentityProvider', () => {
  test('returns user for given OAuth token', async () => {
    const request = {
      get: async function (url, {headers}) {
        const usersByOauthToken = {
          'user-1-token': {login: 'user-1'},
          'user-2-token': {login: 'user-2'}
        }

        const authorizationHeader = headers['Authorization']
        const token = authorizationHeader.split(' ').pop()
        const user = usersByOauthToken[token]

        return JSON.stringify(user)
      }
    }

    const provider = new IdentityProvider({request})

    const user1 = await provider.getUser('user-1-token')
    assert.equal(user1.username, 'user-1')

    const user2 = await provider.getUser('user-2-token')
    assert.equal(user2.username, 'user-2')
  })
})
