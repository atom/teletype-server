exports.up = (pgm) => {
  pgm.addColumns('portals', {last_site_id: {type: 'int', default: 1}})
  pgm.dropColumns('shared_buffers', ['last_site_id'])
}
