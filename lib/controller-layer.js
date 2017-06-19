const assert = require('assert')
const express = require('express')
const bodyParser = require('body-parser')
const ModelLayer = require('./model-layer')

module.exports = ({db, pubSubGateway, maxMessageSizeInBytes}) => {
  assert(maxMessageSizeInBytes > 0, 'maxMessageSizeInBytes must be greater than 0')

  const app = express()
  app.use(bodyParser.json())

  const modelLayer = new ModelLayer({db, pubSubGateway})

  app.post('/portals', async function (req, res) {
    const id = await modelLayer.createPortal()
    res.send({id})
  })

  app.put('/portals/:id', async function (req, res) {
    const portalId = req.params.id
    const rawSharedEditorId = req.body.sharedEditorId
    const sharedEditorId = rawSharedEditorId ? parseInt(rawSharedEditorId) : null
    await modelLayer.setPortalActiveSharedEditor(portalId, sharedEditorId)
    pubSubGateway.broadcast(
      `/portals/${portalId}`,
      'update',
      {text: JSON.stringify({activeSharedEditorId: sharedEditorId})}
    )
    res.send({})
  })

  app.get('/portals/:id', async function (req, res) {
    const {activeSharedEditorId} = await modelLayer.findPortal(req.params.id)
    res.send({activeSharedEditorId})
  })

  app.post('/shared-editors', async function (req, res) {
    const {sharedBufferId, selectionRanges} = req.body
    const id = await modelLayer.createSharedEditor({sharedBufferId, selectionRanges})
    res.send({id})
  })

  app.get('/shared-editors/:id', async function (req, res) {
    const {sharedBufferId, selectionMarkerLayersBySiteId} = await modelLayer.findSharedEditor(parseInt(req.params.id))
    res.send({sharedBufferId, selectionMarkerLayersBySiteId})
  })

  app.put('/shared-editors/:id/selection-marker-layers/:siteId', async function (req, res) {
    const {markerRanges, messageId} = req.body
    const sharedEditorId = parseInt(req.params.id)
    const siteId = parseInt(req.params.siteId)

    await modelLayer.setSharedEditorSelectionRanges(sharedEditorId, siteId, markerRanges)

    broadcast(
      `/shared-editors/${sharedEditorId}`,
      'update',
      messageId,
      {siteId, markerRanges}
    )
    res.send({})
  })

  app.post('/shared-buffers', async function (req, res) {
    const {uri, operations} = req.body
    const id = await modelLayer.createSharedBuffer({uri, operations})
    res.send({id})
  })

  app.post('/shared-buffers/:id/sites', async function (req, res) {
    const {siteId, uri} = await modelLayer.joinSharedBuffer(parseInt(req.params.id))
    const operations = await modelLayer.findSharedBufferOperations(parseInt(req.params.id))
    res.send({siteId, uri, operations})
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
