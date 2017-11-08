const assert = require('assert')
const {RequestError, StatusCodeError} = require('request-promise-core/lib/errors')
const IdentityProvider = require('../lib/identity-provider')

suite('IdentityProvider', () => {
  test('returns user associated with OAuth token', async () => {
    const request = {
      get: async function (url, {headers}) {
        const usersByOauthToken = {
          'user-1-token': {id: 1, login: 'user-1'},
          'user-2-token': {id: 2, login: 'user-2'}
        }

        const authorizationHeader = headers['Authorization']
        const token = authorizationHeader.split(' ').pop()
        const user = usersByOauthToken[token]

        return JSON.stringify(user)
      }
    }

    const provider = new IdentityProvider({request})

    const user1 = await provider.identityForToken('user-1-token')
    assert.deepEqual(user1, {id: '1', login: 'user-1'})

    const user2 = await provider.identityForToken('user-2-token')
    assert.deepEqual(user2, {id: '2', login: 'user-2'})
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
    try {
      await provider.identityForToken('some-invalid-token')
    } catch (e) {
      error = e
    }

    assert(error.message.includes('401'), 'Expected error to include status code')
  })

  test('throws an error when API rate limit is exceeded', async () => {
    const request = {
      get: async function (url, {headers}) {
        const body = JSON.stringify({message: 'API rate limit exceeded'})
        throw new StatusCodeError(403, body)
      }
    }

    const provider = new IdentityProvider({request})

    let error = null
    try {
      await provider.identityForToken('some-token')
    } catch (e) {
      error = e
    }

    assert(error.message.includes('403'), 'Expected error to include status code')
  })

  test('throws an error when GitHub API is inaccessible', async () => {
    const request = {
      get: async function (url, {headers}) {
        throw new RequestError('a request error')
      }
    }

    const provider = new IdentityProvider({request})

    let error = null
    try {
      await provider.identityForToken('some-token')
    } catch (e) {
      error = e
    }

    assert(error.message.includes('a request error'), 'Expected error to include request error message')
  })
})
