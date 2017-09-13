const uuid = require('uuid/v4')
const pgPromise = require('pg-promise')

module.exports =
class ModelLayer {
  constructor ({db}) {
    this.db = db
  }

  async createPortal ({hostPeerId}) {
    const id = uuid()
    await this.db.none('INSERT INTO portals (id, host_peer_id) VALUES ($1, $2)', [id, hostPeerId])
    return id
  }

  async findPortal (id) {
    try {
      const result = await this.db.one('SELECT * FROM portals where id = $1', [id])
      return {hostPeerId: result.host_peer_id}
    } catch (e) {
      const malformedUUIDErrorCode = '22P02'
      const noDataErrorCode = pgPromise.errors.queryResultErrorCode.noData
      if (e.code === malformedUUIDErrorCode || e.code === noDataErrorCode) {
        return null
      }
    }
  }
}
