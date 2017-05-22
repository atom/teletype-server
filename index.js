require('dotenv').config()

const express = require('express')
const app = express()
const pgp = require('pg-promise')()
const db = pgp(process.env.DATABASE_URL)

app.post('/buffers', (req, res) => {

})
