require('dotenv').config()
const buildApp = require('./lib/app')
const {app} = buildApp({databaseURL: process.env.DATABASE_URL})
app.listen(process.env.PORT || 3000)
