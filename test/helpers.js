const assert = require('assert')
const pgp = require('pg-promise')()

let db
exports.getDatabase = () => {
  if (!db) db = pgp(process.env.TEST_DATABASE_URL)
  return db
}

exports.cleanDatabase = async (db) => {
  const tables = await db.many(`
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `)
  for (const {name} of tables) {
    if (name === 'migrations') continue
    await db.query(`DELETE FROM ${name}`)
  }
}

exports.TestBuffer =
class TestBuffer {
  constructor (text) {
    this.text = text
  }

  getText () {
    return this.text
  }

  setText (text) {
    this.text = text
  }

  applyMany (operations) {
    assert(Array.isArray(operations))

    for (let i = operations.length - 1; i >= 0; i--) {
      this.apply(operations[i])
    }
  }

  apply (operation) {
    if (operation.type === 'delete') {
      this.delete(operation.position, operation.extent)
    } else if (operation.type === 'insert') {
      this.insert(operation.position, operation.text)
    } else {
      throw new Error('Unknown operation type')
    }
  }

  insert (position, text) {
    this.text = this.text.slice(0, position) + text + this.text.slice(position)
  }

  delete (position, extent) {
    assert(position < this.text.length)
    assert(position + extent <= this.text.length)
    this.text = this.text.slice(0, position) + this.text.slice(position + extent)
  }
}
