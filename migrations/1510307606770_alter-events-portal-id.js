exports.up = (pgm) => {
  pgm.alterColumn('events', 'portal_id', {type: 'string'})
}
