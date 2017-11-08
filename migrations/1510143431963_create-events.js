exports.up = (pgm) => {
  pgm.createType('event_enum', ['create-portal', 'lookup-portal'])
  pgm.createTable('events', {
    id: {type: 'bigserial', primaryKey: true},
    name: {type: 'event_enum'},
    user_id: {type: 'string'},
    portal_id: {type: 'uuid'},
    created_at: {type: 'timestamp with time zone'}
  })
}
