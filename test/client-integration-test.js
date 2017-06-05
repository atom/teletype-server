require('./setup')
const assert = require('assert')
const temp = require('temp')
const {getDatabase, cleanDatabase, TestBuffer} = require('./helpers')
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
    const host = new Client({serverSocketPath})
    const hostBuffer = new TestBuffer('hello world')
    const sharedBuffer = await host.createSharedBuffer(hostBuffer)

    const guest = new Client({serverSocketPath})
    const guestBuffer = new TestBuffer('')
    await guest.joinSharedBuffer(sharedBuffer.id, guestBuffer)
    assert.equal(guestBuffer.getText(), 'hello world')
  })
})
