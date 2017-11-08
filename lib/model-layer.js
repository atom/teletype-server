const crypto = require('crypto')
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

  async createEvent (event) {
    const {name, identity, portalId} = event
    try {
      const loginHash = crypto.createHash('sha1').update(identity.login).digest('hex')
      await this.db.none(
        'INSERT INTO events (name, user_id, portal_id) VALUES ($1, $2, $3)',
        [name, loginHash, portalId]
      )
    } catch (error) {
      console.error('Failed to create event: ', event)
      console.error(error)
    }
  }

  getEvents () {
    return this.db.manyOrNone('SELECT * FROM events')
  }

  async isOperational () {
    try {
      await this.db.one('select')
      return true
    } catch (error) {
      return false
    }
  }
}
