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
    res.send({version: 2})
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
    if (!oauthToken) {
      res.status(400).send({})
      return
    }

    const message = {senderId, signal, sequenceNumber}
    if (testEpoch != null) message.testEpoch = testEpoch

    if (sequenceNumber === 0) {
      try {
        message.senderIdentity = await identityProvider.identityForToken(oauthToken)
      } catch (error) {
        res.status(error.statusCode).send({message: 'Error resolving identity for token: ' + error.message})
        return
      }
    }

    pubSubGateway.broadcast(`/peers/${req.params.id}`, 'signal', message)
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

  app.get('/identity', async function (req, res) {
    const oauthToken = req.get('GitHub-OAuth-token')
    try {
      const identity = await identityProvider.identityForToken(oauthToken)
      res.send(identity)
    } catch (error) {
      res.status(error.statusCode).send({message: 'Error resolving identity for token: ' + error.message})
    }
  })

  // For use in testing exception reporting (i.e., bugsnag integration)
  app.get('/boomtown', function (req, res) {
    if (req.query.secret !== boomtownSecret) {
      res.status(404).send({})
      return
    }

    throw new Error('boom')
  })

  app.get('/_ping', async function (req, res) {
    const unhealthyServices = []
    if (!await pubSubGateway.isOperational()) unhealthyServices.push('pubSubGateway')
    if (!await modelLayer.isOperational()) unhealthyServices.push('db')
    if (!await isICEServerProviderOperational()) unhealthyServices.push('iceServerProvider')
    if (!await identityProvider.isOperational()) unhealthyServices.push('identityProvider')

    if (unhealthyServices.length === 0) {
      res.status(200).send({
        now: Date.now(),
        status: 'ok'
      })
    } else {
      res.status(503).send({
        now: Date.now(),
        status: 'failures',
        failures: unhealthyServices
      })
    }
  })

  async function isICEServerProviderOperational () {
    try {
      await fetchICEServers()
      return true
    } catch (_) {
      return false
    }
  }

  app.use(bugsnag.errorHandler)
  return app
}
