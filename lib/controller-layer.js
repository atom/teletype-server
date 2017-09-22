const assert = require('assert')
const bugsnag = require('bugsnag')
const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

const PERCENTAGE_OF_TWILIO_TTL_TO_USE_FOR_CACHE_HEADER = 0.95

module.exports = ({modelLayer, pubSubGateway, identityProvider, fetchICEServers, boomtownSecret}) => {
  const app = express()
  app.use(bodyParser.json({limit: '1mb'}))
  app.use(bugsnag.requestHandler)

  app.get('/protocol-version', function (req, res) {
    res.send({version: 1})
  })

  app.get('/ice-servers', async function (req, res) {
    if (fetchICEServers) {
      const {servers, ttl} = await fetchICEServers()
      const maxAgeInSeconds = ttl * PERCENTAGE_OF_TWILIO_TTL_TO_USE_FOR_CACHE_HEADER
      res.set('Cache-Control', `private, max-age=${maxAgeInSeconds}`)
      res.send(servers)
    } else {
      res.send([])
    }
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

  app.get('/boomtown', function (req, res) {
    if (req.query.secret === boomtownSecret) {
      throw new Error('boom')
    } else {
      res.status(404).send({})
    }
  })

  app.use(bugsnag.errorHandler)
  return app
}
