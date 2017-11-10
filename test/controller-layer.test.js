const assert = require('assert')
const {startTestServer} = require('..')
const {get, post} = require('./helpers/request')
const deepEqual = require('deep-equal')
const condition = require('./helpers/condition')

suite('Controller', () => {
  let server

  suiteSetup(async () => {
    server = await startTestServer({databaseURL: process.env.TEST_DATABASE_URL})
  })

  suiteTeardown(() => {
    return server.stop()
  })

  setup(() => {
    return server.reset()
  })

  suite('POST /peers/:id/signals', () => {
    test('sends authenticated signals to the peer with the given id', async () => {
      const peer1Identity = await server.identityProvider.identityForToken('peer-1-token')

      const signals = []
      await server.pubSubGateway.subscribe('/peers/peer-2', 'signal', (signal) => signals.push(signal))

      signals.length = 0
      await post(server, '/peers/peer-2/signals', {
        senderId: 'peer-1',
        signal: 'signal-1',
        sequenceNumber: 0
      }, {headers: {'GitHub-OAuth-token': 'peer-1-token'}})
      await condition(() => deepEqual(signals, [{
        senderId: 'peer-1',
        senderIdentity: peer1Identity,
        signal: 'signal-1',
        sequenceNumber: 0
      }]))

      signals.length = 0
      await post(server, '/peers/peer-2/signals', {
        senderId: 'peer-1',
        signal: 'signal-1',
        sequenceNumber: 1
      }, {headers: {'GitHub-OAuth-token': 'peer-1-token'}})
      await condition(() => deepEqual(signals, [{
        senderId: 'peer-1',
        signal: 'signal-1',
        sequenceNumber: 1
      }]))
    })

    test('returns a 401 status code when authentication fails', async () => {
      const signals = []
      await server.pubSubGateway.subscribe('/peers/peer-2', 'signal', (signal) => signals.push(signal))

      try {
        server.identityProvider.identityForToken = simulateAuthenticationError

        let responseError
        try {
          await post(server, '/peers/peer-id/signals', {
            oauthToken: 'token',
            senderId: 'sender',
            signal: 'signal',
            sequenceNumber: 0
          })
        } catch (e) {
          responseError = e
        }

        assert.equal(responseError.statusCode, 401)
        assert.deepEqual(signals, [])
      } finally {
        delete server.identityProvider.identityForToken
      }
    })
  })

  suite('GET /identity', () => {
    test('returns the identity associated with the given OAuth token', async () => {
      const identity = await get(server, '/identity', {
        headers: {'GitHub-OAuth-token': 'peer-1-token'}
      })
      assert.deepEqual(identity, {id: 'user-with-token-peer-1-token-id', login: 'user-with-token-peer-1-token'})
    })

    test('returns a 401 status code when authentication fails', async () => {
      try {
        server.identityProvider.identityForToken = simulateAuthenticationError

        let responseError
        try {
          await get(server, '/identity', {
            headers: {'GitHub-OAuth-token': 'peer-1-token'}
          })
        } catch (e) {
          responseError = e
        }

        assert.equal(responseError.statusCode, 401)
        assert.equal(responseError.error.message, 'Error resolving identity for token: an error')
      } finally {
        delete server.identityProvider.identityForToken
      }
    })
  })

  suite('events', () => {
    test('stores events on POST /portals and GET /portals/:id', async () => {
      const peer1Headers = {headers: {'GitHub-OAuth-token': 'peer-1-token'}}
      const peer2Headers = {headers: {'GitHub-OAuth-token': 'peer-2-token'}}

      const {id: portal1Id} = await post(server, '/portals', {hostPeerId: 'some-id'}, peer1Headers)
      await get(server, '/portals/' + portal1Id, peer2Headers)

      const {id: portal2Id} = await post(server, '/portals', {hostPeerId: 'some-id'}, peer2Headers)
      await get(server, '/portals/' + portal2Id, peer1Headers)

      const malformedPortalId = '123456'
      try {
        await get(server, '/portals/' + malformedPortalId, peer1Headers)
      } catch (e) {}

      await condition(async () => (await server.modelLayer.getEvents()).length === 5)
      const events = await server.modelLayer.getEvents()

      assert.equal(events[0].name, 'create-portal')
      assert.equal(events[0].portal_id, portal1Id)

      assert.equal(events[1].name, 'lookup-portal')
      assert.equal(events[1].portal_id, portal1Id)

      assert.equal(events[2].name, 'create-portal')
      assert.equal(events[2].portal_id, portal2Id)

      assert.equal(events[3].name, 'lookup-portal')
      assert.equal(events[3].portal_id, portal2Id)

      assert.equal(events[4].name, 'lookup-portal')
      assert.equal(events[4].portal_id, malformedPortalId)

      // Ensure user_id changes depending on the signed in user.
      assert.notEqual(events[0].user_id, events[1].user_id)
      assert.equal(events[0].user_id, events[3].user_id)
      assert.equal(events[1].user_id, events[2].user_id)
      assert.equal(events[3].user_id, events[4].user_id)

      // Ensure events are timestamped using the database clock.
      assert(events[0].created_at < events[1].created_at)
      assert(events[1].created_at < events[2].created_at)
      assert(events[2].created_at < events[3].created_at)
      assert(events[3].created_at < events[4].created_at)
    })
  })
})

function simulateAuthenticationError (token) {
  const error = new Error('an error')
  error.statusCode = 499
  throw error
}
