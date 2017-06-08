exports.up = (pgm) => {
  pgm.addColumns('shared_buffers', {
    uri: {type: 'varchar(1024)'}
  })
}
