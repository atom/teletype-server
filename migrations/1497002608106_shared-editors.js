exports.up = (pgm) => {
  pgm.createTable('shared_editors', {
    id: {type: 'bigserial', primaryKey: true},
    shared_buffer_id: {type: 'bigint', references: 'shared_buffers'}
  })

  pgm.createTable('shared_editor_selection_marker_layers', {
    id: {type: 'bigserial', primaryKey: true},
    site_id: {type: 'bigint'},
    shared_editor_id: {type: 'bigint', references: 'shared_editors'},
    marker_ranges: {type: 'text'}
  })
}
