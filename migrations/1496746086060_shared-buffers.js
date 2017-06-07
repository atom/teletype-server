exports.up = (pgm) => {
  pgm.createTable('shared_buffers', {
    id: 'id',
    last_site_id: {type: 'int', default: 1}
  })
  pgm.createTable('shared_buffer_operations', {
    id: 'id',
    data: {type: 'text'},
    shared_buffer_id: {type: 'int', references: 'shared_buffers'}
  })
}
