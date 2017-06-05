const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({db}) => {
  const app = express()
  app.use(bodyParser.json())

  const modelLayer = new ModelLayer({db})

  app.get('/shared-buffers/:id', async function (req, res) {
    const operations = await modelLayer.findSharedBufferOperations(parseInt(req.params.id))
    res.send({operations})
  })

  app.post('/shared-buffers', async function (req, res) {
    const id = await modelLayer.createSharedBuffer({operations: req.body.operations})
    res.send({id})
  })

  return app
}
