const pgp = require('pg-promise')()

const OP_TYPE_INSERT = 0
const OP_TYPE_DELETE = 1

const BULK_INSERTION_BATCH_SIZE = 10000

module.exports =
class ModelLayer {
  constructor ({db}) {
    this.db = db
  }

  async createSharedBuffer ({uri, operations}) {
    const {id: sharedBufferId} = await this.db.one(`
      INSERT INTO shared_buffers (last_site_id, uri)
      VALUES (1, $1)
      RETURNING id
    `, [uri])
    await this.appendSharedBufferOperations(sharedBufferId, operations)
    return sharedBufferId
  }

  async joinSharedBuffer (sharedBufferId) {
    const result = await this.db.one(`
      UPDATE shared_buffers
      SET last_site_id = last_site_id + 1
      WHERE id = $1
      RETURNING last_site_id, uri
    `, [sharedBufferId])
    return {siteId: result.last_site_id, uri: result.uri}
  }

  async findSharedBufferOperations (id) {
    const operations = await this.db.query(`
      SELECT data
      FROM shared_buffer_operations
      WHERE shared_buffer_id = $1
      ORDER BY id ASC
    `, [id])
    return operations.map((o) => o.data)
  }

  async appendSharedBufferOperations (sharedBufferId, operations) {
    return this.db.tx(async (t) => {
      const columnSet = new pgp.helpers.ColumnSet(['shared_buffer_id', 'data'], {table: 'shared_buffer_operations'})

      for (let i = 0; i < operations.length; i += BULK_INSERTION_BATCH_SIZE) {
        const recordsToInsert = operations.slice(i, i + BULK_INSERTION_BATCH_SIZE).map((data) => {
          return {shared_buffer_id: sharedBufferId, data}
        })
        await t.none(pgp.helpers.insert(recordsToInsert, columnSet))
      }
    })
  }
}
