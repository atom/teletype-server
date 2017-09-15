const uuid = require('uuid/v4')

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
      const result = await this.db.oneOrNone('SELECT * FROM portals where id = $1', [id])
      return (result == null) ? null : {hostPeerId: result.host_peer_id}
    } catch (e) {
      const malformedUUIDErrorCode = '22P02'
      if (e.code === malformedUUIDErrorCode) return null
    }
  }
}
