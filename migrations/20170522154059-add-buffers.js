exports.up = async (db) => {
  await db.createTable('buffers', {
   id: {type: 'int', primaryKey: true, autoIncrement: true},
   base_text: 'text'
  })
  await db.createTable('buffer_operations', {
    id: {type: 'int', primaryKey: true, autoIncrement: true},
    buffer_id: {
      type: 'int',
      foreignKey: {
        name: 'buffer_operations_buffer_id_fk',
        table: 'buffers',
        rules: {onDelete: 'CASCADE'},
        mapping: 'id'
      }
    },
    base_text: 'text'
  })
}

exports.down = async (db) => {
  await db.dropTable('buffer_operations')
  await db.dropTable('buffers')
}

exports._meta = {
  'version': 1
}
