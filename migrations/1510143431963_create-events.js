exports.up = (pgm) => {
  pgm.createTable('events', {
    id: {type: 'bigserial', primaryKey: true},
    name: {type: 'string'},
    user_id: {type: 'string'},
    portal_id: {type: 'uuid'},
    created_at: {type: 'timestamp with time zone'}
  })
}
