exports.up = (pgm) => {
  pgm.createTable('shared_editors', {
    id: 'id',
    scroll_position: {type: 'text'},
    shared_buffer_id: {type: 'int', references: 'shared_buffers'}
  })
}
