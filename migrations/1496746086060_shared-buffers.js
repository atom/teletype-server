exports.up = (pgm) => {
  pgm.createTable('shared_buffers', {
    id: {type: 'bigserial', primaryKey: true},
    last_site_id: {type: 'int', default: 1}
  })
  pgm.createTable('shared_buffer_operations', {
    id: {type: 'bigserial', primaryKey: true},
    data: {type: 'text'},
    shared_buffer_id: {type: 'bigint', references: 'shared_buffers'}
  })
}
