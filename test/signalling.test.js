const assert = require('assert')
const {startTestServer} = require('..')
const {post} = require('./helpers/request')
const deepEqual = require('deep-equal')
const condition = require('./helpers/condition')

suite('/peers/:id/signals', () => {
  let server

  suiteSetup(async () => {
    server = await startTestServer()
  })

  suiteTeardown(() => {
    return server.stop()
  })

  setup(() => {
    return server.reset()
  })

  test('sends authenticated signals to the peer with the given id', async () => {
    const signals = []
    await server.pubSubGateway.subscribe('/peers/peer-2', 'signal', (signal) => signals.push(signal))

    signals.length = 0
    await post(server, '/peers/peer-2/signals', {
      oauthToken: 'peer-1-token',
      senderId: 'peer-1',
      signal: 'signal-1',
      sequenceNumber: 0
    })
    await condition(() => deepEqual(signals, [{
      senderId: 'peer-1',
      senderIdentity: {login: 'user-with-token-peer-1-token'},
      signal: 'signal-1',
      sequenceNumber: 0
    }]))

    signals.length = 0
    await post(server, '/peers/peer-2/signals', {
      oauthToken: 'peer-1-token',
      senderId: 'peer-1',
      signal: 'signal-1',
      sequenceNumber: 1
    })
    await condition(() => deepEqual(signals, [{
      senderId: 'peer-1',
      signal: 'signal-1',
      sequenceNumber: 1
    }]))
  })

  test('returns 400 when OAuth token is missing', async () => {
    const signals = []
    await server.pubSubGateway.subscribe('/peers/peer-2', 'signal', (signal) => signals.push(signal))

    let responseError
    try {
      await post(server, '/peers/peer-2/signals', {
        senderId: 'peer-1',
        signal: 'signal-1',
        sequenceNumber: 0
      })
    } catch (e) {
      responseError = e
    }

    assert.equal(responseError.statusCode, 400)
    assert.deepEqual(signals, [])
  })

  test('returns 401 when authentication fails', async () => {
    const signals = []
    await server.pubSubGateway.subscribe('/peers/peer-2', 'signal', (signal) => signals.push(signal))
    server.identityProvider.setIdentitiesByToken({'peer-1-token': null})

    let responseError
    try {
      await post(server, '/peers/peer-2/signals', {
        oauthToken: 'peer-1-token',
        senderId: 'peer-1',
        signal: 'signal-1',
        sequenceNumber: 0
      })
    } catch (e) {
      responseError = e
    }

    assert.equal(responseError.statusCode, 401)
    assert.equal(responseError.error.message, 'Error resolving identity for token')
    assert.deepEqual(signals, [])
  })
})
