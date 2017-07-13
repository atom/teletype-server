const assert = require('assert')
const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({modelLayer, pubSubGateway}) => {
  const app = express()
  app.use(bodyParser.json({limit: '1mb'}))

  app.post('/peers/:id/signals', function (req, res) {
    pubSubGateway.broadcast(
      `/peers/${req.params.id}`,
      'signal',
      req.body
    )
    res.send({})
  })

  app.post('/portals', async function (req, res) {
    const id = await modelLayer.createPortal({peerId: req.body.peerId})
    res.send({id})
  })

  return app
}
