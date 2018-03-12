const assert = require('assert')
const express = require('express')
const request = require('request-promise-native')
const {authenticate, disableResponseHeaders, enforceProtocol} = require('../lib/middleware')

const HTTPTestServer = require('./../lib/http-test-server')

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

suite('disableResponseHeaders', () => {
  let server

  suiteSetup(async () => {
    const app = express()
    app.use(disableResponseHeaders({
      headers: ['etag', 'x-custom-header-b'],
      paths: ['/foo']
    }))

    app.get('/foo', function (req, res) {
      res.set('X-Custom-Header-A', 'A')
      res.set('X-Custom-Header-B', 'B')
      res.send({})
    })

    app.get('/bar', function (req, res) {
      res.set('X-Custom-Header-A', 'A')
      res.set('X-Custom-Header-B', 'B')
      res.send({})
    })

    server = new HTTPTestServer({app})
    await server.listen()
    return server
  })

  suiteTeardown(() => {
    return server.destroy()
  })

  test('disables the specified standard response headers for the specified paths', async () => {
    const root = server.address()

    let response = await request.get(`${root}/foo`, {resolveWithFullResponse: true})
    assert.equal(response.headers['etag'], null)

    response = await request.get(`${root}/bar`, {resolveWithFullResponse: true})
    assert(response.headers['etag'])
  })

  test('disables the specified custom response headers for the specified paths', async () => {
    const root = server.address()

    let response = await request.get(`${root}/foo`, {resolveWithFullResponse: true})
    assert.equal(response.headers['x-custom-header-a'], 'A')
    assert.equal(response.headers['x-custom-header-b'], null)

    response = await request.get(`${root}/bar`, {resolveWithFullResponse: true})
    assert.equal(response.headers['x-custom-header-a'], 'A')
    assert.equal(response.headers['x-custom-header-b'], 'B')
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
