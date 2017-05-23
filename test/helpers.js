const pgp = require('pg-promise')()

let db
exports.getDatabase = () => {
  if (!db) db = pgp(process.env.TEST_DATABASE_URL)
  return db
}

exports.cleanDatabase = async (db) => {
  const tables = await db.many(`
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `)
  for (const {name} of tables) {
    if (name === 'migrations') continue
    await db.query(`DELETE FROM ${name}`)
  }
}
