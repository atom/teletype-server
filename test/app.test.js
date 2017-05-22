const {cleanDatabase} = require('./setup')

const DatabaseCleaner = require('database-cleaner')
const assert = require('assert')
const buildApp = require('../lib/app')
const {app, db} = buildApp({databaseURL: process.env.TEST_DATABASE_URL})

suite('/buffers', () => {
  afterEach(async () => {
    await cleanDatabase(db)
  })

  test('POST /buffers', async () => {

  })
})
