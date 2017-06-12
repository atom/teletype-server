exports.up = (pgm) => {
  pgm.createTable('shared_editors', {
    id: 'id',
    shared_buffer_id: {type: 'int', references: 'shared_buffers'}
  })

  pgm.createTable('shared_editor_selection_marker_layers', {
    id: 'id',
    site_id: {type: 'int'},
    shared_editor_id: {type: 'int', references: 'shared_editors'},
    marker_ranges: {type: 'text'}
  })
}
