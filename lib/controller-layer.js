const assert = require('assert')
const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({modelLayer, pubSubGateway, identityProvider, fetchICEServers}) => {
  const app = express()
  app.use(bodyParser.json({limit: '1mb'}))

  app.get('/ice-servers', async function (req, res) {
    if (fetchICEServers) {
      res.send(await fetchICEServers())
    } else {
      res.send(null)
    }
  })

  app.post('/peers/:id/signals', async function (req, res) {
    const {senderId, oauthToken, data, sequenceNumber} = req.body
    const user = await identityProvider.getUser(oauthToken)
    pubSubGateway.broadcast(
      `/peers/${req.params.id}`,
      'signal',
      {senderId, user, data, sequenceNumber}
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

  // TODO Pass OAuth token in header instead of (often-logged) query param
  app.get('/user', async function (req, res) {
    const user = await identityProvider.getUser(req.query.oauthToken)
    res.send(user)
  })

  return app
}
