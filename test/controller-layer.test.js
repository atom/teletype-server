const assert = require('assert')
const {startTestServer} = require('..')
const {get, post} = require('./helpers/request')
const deepEqual = require('deep-equal')
const condition = require('./helpers/condition')

suite('Controller', () => {
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

  suite('/peers/:id/signals', () => {
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

  suite('/identity', () => {
    test('returns the identity associated with the given OAuth token', async () => {
      const identity = await get(server, '/identity', {
        headers: {'GitHub-OAuth-token': 'peer-1-token'}
      })
      assert.deepEqual(identity, {login: 'user-with-token-peer-1-token'})
    })

    test('returns 401 when authentication fails', async () => {
      server.identityProvider.setIdentitiesByToken({'peer-1-token': null})

      let responseError
      try {
        await get(server, '/identity', {
          headers: {'GitHub-OAuth-token': 'peer-1-token'}
        })
      } catch (e) {
        responseError = e
      }

      assert.equal(responseError.statusCode, 401)
      assert.equal(responseError.error.message, 'No identity found for OAuth token')
    })
  })
})
