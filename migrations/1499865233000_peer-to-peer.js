exports.up = (pgm) => {
  pgm.dropTable('sites')
  pgm.dropColumns('portals', ['active_shared_editor_id'])
  pgm.addColumns('portals', {
    peer_id: {type: 'string'}
  })
}
