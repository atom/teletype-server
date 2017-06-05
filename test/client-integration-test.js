require('./setup')
const assert = require('assert')
const temp = require('temp')
const {getDatabase, cleanDatabase} = require('./helpers/database')
const Buffer = require('./helpers/buffer')
const Network = require('./helpers/network')
const Client = require('../client')
const buildControllerLayer = require('../lib/controller-layer')

suite('Client Integration', () => {
  let db, server, serverSocketPath

  suiteSetup(() => {
    serverSocketPath = temp.path({suffix: '.socket'})
    db = getDatabase()
    const controllerLayer = buildControllerLayer({db})
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
    return cleanDatabase(db)
  })

  test('sharing a buffer from a host and fetching its initial state from a guest', async () => {
    const network = new Network({serverSocketPath})

    const host = new Client({network})
    const hostBuffer = new Buffer('hello world')
    const sharedBuffer = await host.createSharedBuffer(hostBuffer)

    const guest = new Client({network})
    const guestBuffer = new Buffer('')
    await guest.joinSharedBuffer(sharedBuffer.id, guestBuffer)
    assert.equal(guestBuffer.getText(), 'hello world')
  })
})
