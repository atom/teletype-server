const assert = require('assert')
const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({db, pubSubGateway, maxMessageSizeInBytes}) => {
  assert(maxMessageSizeInBytes > 0, 'maxMessageSizeInBytes must be greater than 0')

  const app = express()
  app.use(bodyParser.json())

  const modelLayer = new ModelLayer({db, pubSubGateway})

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
    const {messageId, operations} = req.body
    await modelLayer.appendSharedBufferOperations(sharedBufferId, operations)
    broadcast(
      `/shared-buffers/${sharedBufferId}`,
      'operations',
      messageId,
      operations
    )
    res.send({})
  })

  function broadcast (channelName, eventName, messageId, message) {
    const messageJSON = JSON.stringify(message)
    const fragmentCount = Math.ceil(messageJSON.length / maxMessageSizeInBytes)
    for (let fragmentIndex = 0; fragmentIndex < fragmentCount; fragmentIndex++) {
      pubSubGateway.broadcast(channelName, eventName, {
        messageId,
        fragmentIndex,
        fragmentCount,
        text: messageJSON.slice(
          fragmentIndex * maxMessageSizeInBytes,
          (fragmentIndex + 1) * maxMessageSizeInBytes
        )
      })
    }
  }

  return app
}
