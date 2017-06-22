exports.up = (pgm) => {
  pgm.createTable('sites', {
    id: {type: 'int'},
    portal_id: {type: 'uuid', references: 'portals'},
    last_heartbeat_at: {type: 'timestamp'}
  })
  pgm.sql(`ALTER TABLE sites ADD PRIMARY KEY (id, portal_id)`)
  pgm.createIndex('sites', 'portal_id')
  pgm.dropColumns('portals', 'last_site_id')
}
