require('./setup')
const assert = require('assert')
const temp = require('temp')
const http = require('http')
const request = require('request-promise-native')
const buildControllerLayer = require('../lib/controller-layer')
const {getDatabase, cleanDatabase} = require('./helpers')

suite('Controller Layer', () => {
  let db, controllerLayer, server, socketPath

  suiteSetup(() => {
    db = getDatabase()
    controllerLayer = buildControllerLayer({db})
    socketPath = temp.path({suffix: '.socket'})
    return new Promise((resolve) => {
      server = controllerLayer.listen(socketPath, resolve)
    })
  })

  suiteTeardown(() => {
    return new Promise((resolve) => {
      server.close(resolve)
    })
  })

  setup(async () => {
    await cleanDatabase(db)
  })

  test('POST /shared-buffers', async () => {
    const response = await request.post(`http://unix:${socketPath}:/shared-buffers`, {
      body: {text: 'hello world'},
      json: true
    })

    assert(response.url.match(/^\/shared-buffers\/\d+$/))
    assert(response.channelName.match(/^shared-buffers\.\d+$/))
  })
})
