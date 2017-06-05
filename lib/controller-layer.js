const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({db, network}) => {
  const app = express()
  app.use(bodyParser.json())

  const modelLayer = new ModelLayer({db, network})

  app.post('/shared-buffers', async function (req, res) {
    const id = await modelLayer.createSharedBuffer({operations: req.body.operations})
    res.send({id})
  })

  app.post('/shared-buffers/:id/sites', async function (req, res) {
    const siteId = await modelLayer.getNextSharedBufferSiteId(parseInt(req.params.id))
    const operations = await modelLayer.findSharedBufferOperations(parseInt(req.params.id))
    res.send({siteId, operations})
  })

  app.post('/shared-buffers/:id/operations', async function (req, res) {
    const sharedBufferId = parseInt(req.params.id)
    const operations = req.body.operations
    await modelLayer.appendSharedBufferOperations(sharedBufferId, operations)
    network.broadcast(
      `/shared-buffers/${sharedBufferId}`,
      'operations',
      operations
    )
    res.sendStatus(200)
  })

  return app
}
