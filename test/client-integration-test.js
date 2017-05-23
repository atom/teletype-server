require('./setup')
const assert = require('assert')
const temp = require('temp')
const {getDatabase, cleanDatabase} = require('./helpers')
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
    server.close()
  })

  setup(() => {
    cleanDatabase(db)
  })

  test.only('sharing a buffer from a host and fetching its initial state from a guest', async () => {
    const host = new Client({serverSocketPath})
    const guest = new Client({serverSocketPath})

    const sharedBuffer = await host.createSharedBuffer({
      getLocalText () {
        return 'hello world'
      }
    })

    let client2Text
    await guest.joinSharedBuffer(sharedBuffer.id, {
      setLocalText: (text) => client2Text = text
    })

    assert.equal(client2Text, 'hello world')
  })
})
