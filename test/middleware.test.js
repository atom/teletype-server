const assert = require('assert')
const {authenticate, enforceProtocol} = require('../lib/middleware')

suite('enforceProtocol', () => {
  test('requires HTTPS for production requests', () => {
    let httpRequestAllowed
    const httpRequest = {
      headers: { 'x-forwarded-proto': 'http' },
      app: new Map([['env', 'production']])
    }
    const httpResponse = new FakeResponse()

    enforceProtocol(httpRequest, httpResponse, function () { httpRequestAllowed = true })
    assert(!httpRequestAllowed)
    assert.equal(httpResponse.code, 403)
    assert.deepEqual(httpResponse.body, { message: 'HTTPS required' })

    let httpsRequestAllowed
    const httpsRequest = {
      headers: { 'x-forwarded-proto': 'https' },
      app: new Map([['env', 'production']])
    }
    const httpsResponse = new FakeResponse()

    enforceProtocol(httpsRequest, httpsResponse, () => { httpsRequestAllowed = true })
    assert(httpsRequestAllowed)
  })

  test('allows HTTP for non-production requests', () => {
    let httpRequestAllowed
    const httpRequest = {
      headers: { 'x-forwarded-proto': 'http' },
      app: new Map([['env', 'development']])
    }
    const httpResponse = new FakeResponse()

    enforceProtocol(httpRequest, httpResponse, () => { httpRequestAllowed = true })
    assert(httpRequestAllowed)
  })
})

suite('authenticate', () => {
  test('creates a middleware that performs and enforces authentication', async () => {
    const identityProvider = {
      async identityForToken (token) {
        if (token === 'valid-token') {
          return {login: 'some-user'}
        } else {
          const error = new Error('an error')
          error.statusCode = 499
          throw error
        }
      }
    }
    const ignoredPaths = ['/ignored-path']
    const authenticateMiddleware = authenticate({identityProvider, ignoredPaths})

    // Make a request with a valid token.
    {
      let requestAllowed
      const request = {
        path: '/some-path',
        headers: {'github-oauth-token': 'valid-token'}
      }
      const response = new FakeResponse()
      await authenticateMiddleware(request, response, () => { requestAllowed = true })

      assert(requestAllowed)
      assert.deepEqual(response.locals.identity, {login: 'some-user'})
    }

    // Make a request with an invalid token.
    {
      let requestAllowed
      const request = {
        path: '/some-path',
        headers: {'github-oauth-token': 'invalid-token'}
      }
      const response = new FakeResponse()
      await authenticateMiddleware(request, response, () => { requestAllowed = true })

      assert(!requestAllowed)
      assert.equal(response.code, 401)
      assert.equal(response.body.message, 'Error resolving identity for token: an error')
    }

    // Make a request with a missing token.
    {
      let requestAllowed
      const request = {
        path: '/some-path',
        headers: {}
      }
      const response = new FakeResponse()
      await authenticateMiddleware(request, response, () => { requestAllowed = true })

      assert(!requestAllowed)
      assert.equal(response.code, 401)
      assert.equal(response.body.message, 'Authentication required')
    }

    // Make a request to an ignored path, and don't pass a token.
    {
      let requestAllowed
      const request = {
        path: '/ignored-path',
        headers: {}
      }
      const response = new FakeResponse()
      await authenticateMiddleware(request, response, () => { requestAllowed = true })

      assert(requestAllowed)
      assert(!response.locals.identity)
    }
  })
})

class FakeResponse {
  constructor () {
    this.locals = {}
  }

  status (code) {
    this.code = code
    return this
  }

  send (body) {
    this.body = body
  }
}
