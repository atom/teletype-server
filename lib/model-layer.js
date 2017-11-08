const assert = require('assert')
const bugsnag = require('bugsnag')
const crypto = require('crypto')
const uuid = require('uuid/v4')

module.exports =
class ModelLayer {
  constructor ({db, hashSecret}) {
    this.db = db
    this.hashSecret = hashSecret
    assert(this.hashSecret != null, 'Hash secret cannot be empty')
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
    try {
      const {name, identity, portalId} = event
      const loginHash = crypto.createHash('sha1').update(identity.id + this.hashSecret).digest('hex')
      await this.db.none(
        'INSERT INTO events (name, user_id, portal_id, created_at) VALUES ($1, $2, $3, now())',
        [name, loginHash, portalId]
      )
    } catch (error) {
      bugsnag.notify(error, event)
    }
  }

  getEvents () {
    return this.db.manyOrNone('SELECT * FROM events ORDER BY created_at ASC')
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
