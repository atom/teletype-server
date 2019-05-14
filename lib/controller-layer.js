const assert = require('assert')
const bugsnag = require('bugsnag')
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const {authenticate, enforceProtocol} = require('./middleware')
const ModelLayer = require('./model-layer')

const PERCENTAGE_OF_TWILIO_TTL_TO_USE_FOR_CACHE_HEADER = 0.95

module.exports = ({
  modelLayer,
  pubSubGateway,
  identityProvider,
  fetchICEServers,
  boomtownSecret,
  enableExceptionReporter,
}) => {
  const app = express()
  app.use(cors())
  app.use(bodyParser.json({limit: '1mb'}))
  app.use(enforceProtocol)
  app.use(authenticate({identityProvider, ignoredPaths: ['/', '/protocol-version', '/boomtown', '/_ping']}))
  if (enableExceptionReporter) {
    app.use(bugsnag.requestHandler)
  }

  app.get('/protocol-version', function (req, res) {
    res.set('Cache-Control', 'no-store')
    res.send({version: 9})
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
    const {senderId, signal, sequenceNumber, testEpoch} = req.body
    const message = {senderId, signal, sequenceNumber}
    if (testEpoch != null) message.testEpoch = testEpoch

    if (sequenceNumber === 0) message.senderIdentity = res.locals.identity

    pubSubGateway.broadcast(`/peers/${req.params.id}`, 'signal', message)
    res.send({})
  })

  app.post('/portals', async function (req, res) {
    const id = await modelLayer.createPortal({hostPeerId: req.body.hostPeerId})

    modelLayer.createEvent({
      name: 'create-portal',
      identity: res.locals.identity,
      portalId: id
    })

    res.send({id})
  })

  app.get('/portals/:id', async function (req, res) {
    modelLayer.createEvent({
      name: 'lookup-portal',
      identity: res.locals.identity,
      portalId: req.params.id
    })

    const portal = await modelLayer.findPortal(req.params.id)
    if (portal) {
      res.send({hostPeerId: portal.hostPeerId})
    } else {
      res.status(404).send({})
    }
  })

  app.get('/identity', async function (req, res) {
    res.send(res.locals.identity)
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
    const statuses = await Promise.all([
      pubSubGateway.isOperational(),
      modelLayer.isOperational(),
      isICEServerProviderOperational(),
      identityProvider.isOperational()
    ])

    const unhealthyServices = []
    if (!statuses[0]) unhealthyServices.push('pubSubGateway')
    if (!statuses[1]) unhealthyServices.push('db')
    if (!statuses[2]) unhealthyServices.push('iceServerProvider')
    if (!statuses[3]) unhealthyServices.push('identityProvider')

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

  if (enableExceptionReporter) {
    app.use(bugsnag.errorHandler)
  }
  return app
}
