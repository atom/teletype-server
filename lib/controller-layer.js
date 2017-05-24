const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({db}) => {
  const app = express()
  app.use(bodyParser.json())

  const modelLayer = new ModelLayer({db})

  app.get('/shared-buffers/:id', async function (req, res) {
    const {text} = await modelLayer.findSharedBuffer(parseInt(req.params.id))
    res.send({text})
  })

  app.post('/shared-buffers', async function (req, res) {
    const id = await modelLayer.createSharedBuffer(req.body)
    res.send({id})
  })

  return app
}
