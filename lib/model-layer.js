const uuid = require('uuid/v4')
const pgp = require('pg-promise')()

const OP_TYPE_INSERT = 0
const OP_TYPE_DELETE = 1

const BULK_INSERTION_BATCH_SIZE = 10000

module.exports =
class ModelLayer {
  constructor ({db}) {
    this.db = db
  }

  async createPortal () {
    const id = uuid()
    await this.db.tx(async (t) => {
      await t.none('INSERT INTO portals (id) VALUES ($1)', [id])
      await t.none('INSERT INTO sites (id, portal_id, last_heartbeat_at) VALUES (1, $1, CURRENT_TIMESTAMP)', [id])
    })
    return id
  }

  async setPortalActiveSharedEditor (portalId, sharedEditorId) {
    await this.db.none(`
      UPDATE portals
      SET active_shared_editor_id = $(sharedEditorId)
      WHERE id = $(portalId)
    `, {portalId, sharedEditorId})
  }

  async joinPortal (id) {
    const sitesResult = await this.db.one(`
      INSERT INTO sites (id, portal_id, last_heartbeat_at)
      VALUES (
        (SELECT MAX(id) FROM sites WHERE portal_id = $(portalId)) + 1,
        $(portalId),
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `, {portalId: id})

    const portalsResult = await this.db.one(`
      SELECT active_shared_editor_id
      FROM portals
      WHERE id = $(portalId)
    `, {portalId: id})

    return {siteId: sitesResult.id, activeSharedEditorId: portalsResult.active_shared_editor_id}
  }

  async keepAlive (portalId, siteId) {
    await this.db.none(`
      UPDATE sites
      SET last_heartbeat_at = CURRENT_TIMESTAMP
      WHERE id = $(siteId) AND portal_id = $(portalId)
    `, {siteId, portalId})
  }

  async findDeadSites (evictionPeriodInMilliseconds) {
    const sites = await this.db.query(`
      SELECT id, portal_id, last_heartbeat_at
      FROM sites
      WHERE (CURRENT_TIMESTAMP - last_heartbeat_at) >= interval '$(evictionPeriodInMilliseconds) ms'
    `, {evictionPeriodInMilliseconds})
    return sites.map((s) => ({id: s.id, portalId: s.portal_id}))
  }

  async deleteSite (portalId, siteId) {
    await this.db.none(`
      DELETE FROM sites
      WHERE id = $(siteId) AND portal_id = $(portalId)
    `, {siteId, portalId})
  }

  async createSharedEditor ({sharedBufferId, selectionRanges}) {
    const {id} = await this.db.one(`
      INSERT INTO shared_editors (shared_buffer_id)
      VALUES ($1)
      RETURNING id
    `, [sharedBufferId])

    await this.setSharedEditorSelectionRanges(id, 1, selectionRanges)

    return id
  }

  async setSharedEditorSelectionRanges (sharedEditorId, siteId, markerRanges) {
    const results = await this.db.query(`
      SELECT id from shared_editor_selection_marker_layers
      WHERE shared_editor_id = $1 AND site_id = $2
    `, [sharedEditorId, siteId])

    if (results.length > 0) {
      await this.db.none(`
        UPDATE shared_editor_selection_marker_layers
        SET marker_ranges = $2
        WHERE id = $1
      `, [results[0].id, markerRanges])
    } else {
      await this.db.none(`
        INSERT INTO shared_editor_selection_marker_layers (shared_editor_id, site_id, marker_ranges)
        VALUES ($1, $2, $3)
      `, [sharedEditorId, siteId, markerRanges])
    }
  }

  async findSharedEditor (id) {
    const {shared_buffer_id: sharedBufferId} = await this.db.one(`
      SELECT shared_buffer_id
      FROM shared_editors
      WHERE id = $1
    `, [id])

    const markerLayerResults = await this.db.query(`
      SELECT site_id, marker_ranges
      FROM shared_editor_selection_marker_layers
      WHERE shared_editor_id = $1
    `, [id])

    const selectionMarkerLayersBySiteId = {}
    for (let i = 0; i < markerLayerResults.length; i++) {
      const {site_id, marker_ranges} = markerLayerResults[i]
      selectionMarkerLayersBySiteId[site_id] = marker_ranges
    }

    return {sharedBufferId, selectionMarkerLayersBySiteId}
  }

  async createSharedBuffer ({uri, operations}) {
    const {id: sharedBufferId} = await this.db.one(`
      INSERT INTO shared_buffers (uri)
      VALUES ($1)
      RETURNING id
    `, [uri])
    await this.appendSharedBufferOperations(sharedBufferId, operations)
    return sharedBufferId
  }

  async findSharedBuffer (sharedBufferId) {
    const result = await this.db.one(`
      SELECT uri
      FROM shared_buffers
      WHERE id = $1
    `, [sharedBufferId])
    return {uri: result.uri}
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
