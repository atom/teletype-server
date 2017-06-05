require('./setup')
const assert = require('assert')
const temp = require('temp')
const {getDatabase, cleanDatabase} = require('./helpers/database')
const Buffer = require('./helpers/buffer')
const RestGateway = require('./helpers/rest-gateway')
const PubSubGateway = require('./helpers/pub-sub-gateway')
const ServerPubSubGateway = require('../lib/pusher-pub-sub-gateway')
const ClientPubSubGateway = require('../client/lib/pusher-pub-sub-gateway')
const Client = require('../client')
const buildControllerLayer = require('../lib/controller-layer')

suite('Client Integration', () => {
  let db, server, fakePubSubGateway, serverSocketPath

  // Uncomment and provide credentials to test against Pusher.
  // const pusherCredentials = {
  //   appId: '...',
  //   key: '...'
  //   secret: '...'
  // }

  suiteSetup(() => {
    serverSocketPath = temp.path({suffix: '.socket'})
    db = getDatabase()
    const controllerLayer = buildControllerLayer({db, pubSubGateway: getServerPubSubGateway()})
    return new Promise((resolve) => {
      server = controllerLayer.listen(serverSocketPath, resolve)
    })
  })

  suiteTeardown(() => {
    return new Promise((resolve) => {
      server.close(resolve)
    })
  })

  setup(() => {
    if (fakePubSubGateway) fakePubSubGateway.clear()
    return cleanDatabase(db)
  })

  test('sharing a buffer from a host and fetching its initial state from a guest', async () => {
    const restGateway = new RestGateway({serverSocketPath})

    const host = new Client({restGateway, pubSubGateway: getClientPubSubGateway()})
    const hostBuffer = new Buffer('hello world')
    const hostSharedBuffer = await host.createSharedBuffer(hostBuffer)

    const guest = new Client({restGateway, pubSubGateway: getClientPubSubGateway()})
    const guestBuffer = new Buffer('')
    const guestSharedBuffer = await guest.joinSharedBuffer(hostSharedBuffer.id, guestBuffer)
    assert.equal(guestBuffer.getText(), 'hello world')

    hostSharedBuffer.apply(hostBuffer.insert(5, ' cruel'))
    guestSharedBuffer.apply(guestBuffer.delete(0, 5))
    guestSharedBuffer.apply(guestBuffer.insert(0, 'goodbye'))

    await hostBuffer.whenTextEquals('goodbye cruel world')
    await guestBuffer.whenTextEquals('goodbye cruel world')
  })

  function getServerPubSubGateway () {
    if (typeof pusherCredentials === 'object') {
      return new ServerPubSubGateway(pusherCredentials)
    } else {
      if (!fakePubSubGateway) fakePubSubGateway = new PubSubGateway()
      return fakePubSubGateway
    }
  }

  function getClientPubSubGateway () {
    if (typeof pusherCredentials === 'object') {
      return new ClientPubSubGateway(pusherCredentials)
    } else {
      if (!fakePubSubGateway) fakePubSubGateway = new PubSubGateway()
      return fakePubSubGateway
    }
  }
})
