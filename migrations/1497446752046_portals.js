exports.up = (pgm) => {
  pgm.createTable('portals', {
    id: {type: 'uuid', primaryKey: true},
    active_shared_editor_id: {type: 'bigint', references: 'shared_editors'}
  })
}
