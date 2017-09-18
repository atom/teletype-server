const assert = require('assert')
const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({modelLayer, pubSubGateway, identityProvider, fetchICEServers}) => {
  const app = express()
  app.use(bodyParser.json({limit: '1mb'}))

  app.get('/ice-servers', async function (req, res) {
    let servers = []
    let ttlInMilliseconds = 60 * 60 * 1000

    if (fetchICEServers) {
      const iceServers = await fetchICEServers()
      servers = iceServers.servers
      ttlInMilliseconds = iceServers.ttl * 1000
    }

    const expiry = new Date(Date.now() + ttlInMilliseconds)
    res.set('Expires', expiry.toUTCString())
    res.set('Cache-Control', 'private')
    res.send(servers)
  })

  app.post('/peers/:id/signals', async function (req, res) {
    const {senderId, oauthToken, signal, sequenceNumber, testEpoch} = req.body

    const message = {senderId, signal, sequenceNumber}
    if (testEpoch != null) message.testEpoch = testEpoch

    // TODO _Expect_ oauthToken to be present
    // TODO Handle failure cases
    if (oauthToken != null) message.user = await identityProvider.getUser(oauthToken)

    pubSubGateway.broadcast(
      `/peers/${req.params.id}`,
      'signal',
      message
    )

    res.send({})
  })

  app.post('/portals', async function (req, res) {
    const id = await modelLayer.createPortal({hostPeerId: req.body.hostPeerId})
    res.send({id})
  })

  app.get('/portals/:id', async function (req, res) {
    const portal = await modelLayer.findPortal(req.params.id)
    if (portal) {
      res.send({hostPeerId: portal.hostPeerId})
    } else {
      res.status(404).send({})
    }
  })

  // TODO Replace hardcoded status code with a status code that is specific to the error that occurred
  app.get('/user', async function (req, res) {
    const oauthToken = req.get('GitHub-OAuth-token')
    await identityProvider.getUser(oauthToken).then(
      (user) => { res.send(user) },
      (error) => { res.status(401).send({message: error}) }
    )
  })

  return app
}
