const OP_TYPE_INSERT = 0
const OP_TYPE_DELETE = 1

module.exports =
class ModelLayer {
  constructor ({db}) {
    this.db = db
  }

  async createSharedBuffer ({operations}) {
    const {id: sharedBufferId} = await this.db.one('INSERT INTO shared_buffers (last_site_id) VALUES (1) RETURNING id')
    await this.appendSharedBufferOperations(sharedBufferId, operations)
    return sharedBufferId
  }

  async getNextSharedBufferSiteId (sharedBufferId) {
    const result = await this.db.one(`
      UPDATE shared_buffers
      SET last_site_id = last_site_id + 1
      WHERE id = $1
      RETURNING last_site_id
    `, [sharedBufferId])
    return result.last_site_id
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
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i]
        await t.none(
          `
            INSERT INTO shared_buffer_operations (shared_buffer_id, data)
            VALUES ($(sharedBufferId), $(data))
          `,
          {sharedBufferId, data: op}
        )
      }
    })
  }
}
