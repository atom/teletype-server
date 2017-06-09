exports.up = (pgm) => {
  pgm.createTable('shared_editors', {
    id: 'id',
    shared_buffer_id: {type: 'int', references: 'shared_buffers'},
    selection_ranges: {type: 'text'}
  })
}
