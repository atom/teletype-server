const assert = require('assert')
const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({modelLayer, pubSubGateway, fetchICEServers}) => {
  const app = express()
  app.use(bodyParser.json({limit: '1mb'}))

  app.get('/ice-servers', async function (req, res) {
    if (fetchICEServers) {
      res.send(await fetchICEServers())
    } else {
      res.send(null)
    }
  })

  app.post('/peers/:id/signals', function (req, res) {
    pubSubGateway.broadcast(
      `/peers/${req.params.id}`,
      'signal',
      req.body
    )
    res.send({})
  })

  app.post('/portals', async function (req, res) {
    const id = await modelLayer.createPortal({hostPeerId: req.body.hostPeerId})
    res.send({id})
  })

  app.get('/portals/:id', async function (req, res) {
    const {hostPeerId} = await modelLayer.findPortal(req.params.id)
    res.send({hostPeerId})
  })

  return app
}
