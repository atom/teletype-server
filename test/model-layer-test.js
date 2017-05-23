require('./setup')
const assert = require('assert')
const {getDatabase, cleanDatabase} = require('./helpers')
const ModelLayer = require('../lib/model-layer')

suite('Model Layer', () => {
  let db, modelLayer

  suiteSetup(() => {
    db = getDatabase()
  })

  setup(async () => {
    await cleanDatabase(db)
    modelLayer = new ModelLayer({db})
  })

  test('createSharedBuffer', async () => {
    const id = await modelLayer.createSharedBuffer({text: 'hello world'})
    assert(typeof id === 'number')
  })
})
