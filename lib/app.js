const express = require('express')
const app = express()
const pgp = require('pg-promise')()

module.exports = ({databaseURL}) => {
  const db = pgp(databaseURL)

  app.post('/buffers', async (req, res) => {
    const x = await db.query('INSERT INTO buffers VALUES ($1)', req.params.text)
    console.log(x);
  })

  return {app, db}
}
