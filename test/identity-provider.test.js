const assert = require('assert')
const {StatusCodeError} = require('request-promise-core/lib/errors')
const IdentityProvider = require('../lib/identity-provider')

suite('IdentityProvider', () => {
  test('returns user associated with OAuth token', async () => {
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

  test('throws an error when given an invalid OAuth token', async () => {
    const request = {
      get: async function (url, {headers}) {
        const body = JSON.stringify({message: 'Bad credentials'})
        throw new StatusCodeError(401, body)
      }
    }

    const provider = new IdentityProvider({request})

    let error = null
    await provider.getUser('some-invalid-token').
      then(
        (value) => {},
        (rejection) => {error = rejection}
      ).then(
        () => {
          assert(error)
          assert(error.includes('401'), 'Expected error to include status code')
        }
      )
  })

  test.skip('throws an error when API rate limit is exceeded', function() {
    // TODO
  })

  test.skip('throws an error when GitHub API is inaccessible', function() {
    // TODO
  })
})
