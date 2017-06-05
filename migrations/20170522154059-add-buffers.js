exports.up = async (db) => {
  await db.createTable('shared_buffers', {
    id: {type: 'int', primaryKey: true, autoIncrement: true}
  })
  await db.createTable('shared_buffer_operations', {
    id: {type: 'int', primaryKey: true, autoIncrement: true},
    type: {type: 'int'},
    site: {type: 'int'},
    seq: {type: 'int'},
    text: {type: 'text'},
    extent: {type: 'int'},
    left_dependency_site: {type: 'int'},
    left_dependency_seq: {type: 'int'},
    offset_in_left_dependency: {type: 'int'},
    right_dependency_site: {type: 'int'},
    right_dependency_seq: {type: 'int'},
    offset_in_right_dependency: {type: 'int'},
    shared_buffer_id: {
      type: 'int',
      foreignKey: {
        name: 'shared_buffer_operations_buffer_id_fk',
        table: 'shared_buffers',
        rules: {onDelete: 'CASCADE'},
        mapping: 'id'
      }
    }
  })
}

exports.down = async (db) => {
  await db.dropTable('shared_buffer_operations')
  await db.dropTable('shared_buffers')
}

exports._meta = {
  'version': 1
}
