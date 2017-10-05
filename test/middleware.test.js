const assert = require('assert')
const {enforceProtocol} = require('../lib/middleware')

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

class FakeResponse {
  status (code) {
    this.code = code
    return this
  }

  send (body) {
    this.body = body
  }
}
