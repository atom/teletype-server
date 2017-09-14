const assert = require('assert')
const enableDestroy = require('server-destroy')
const path = require('path')
const childProcess = require('child_process')
const temp = require('temp')
const pgp = require('pg-promise')()
const buildControllerLayer = require('./controller-layer')
const ModelLayer = require('./model-layer')
const PusherPubSubGateway = require('../lib/pusher-pub-sub-gateway')

module.exports =
class TestServer {
  constructor ({databaseURL, pusherCredentials} = {}) {
    this.databaseURL = databaseURL
    this.pusherCredentials = pusherCredentials
  }

  start () {
    if (this.databaseURL) this.migrateDatabase()
    return this.listenOnDomainSocket()
  }

  stop () {
    return new Promise((resolve) => this.server.destroy(resolve))
  }

  async reset () {
    if (this.databaseURL) {
      const tables = [
        'portals'
      ]
      for (const table of tables) {
        await this.db.query(`DELETE FROM ${table}`)
      }
    }

    this.pubSubGateway.reset()
  }

  migrateDatabase () {
    const pgMigratePath = require.resolve('node-pg-migrate/bin/pg-migrate')
    const migrateUpResult = childProcess.spawnSync(
      pgMigratePath,
      ['up', '--migrations-dir', path.join(__dirname, '..', 'migrations')],
      {env: Object.assign({DATABASE_URL: this.databaseURL}, process.env)}
    )
    if (migrateUpResult.status !== 0) {
      throw new Error('Error running migrations:\n\n' + migrateUpResult.output)
    }
  }

  listenOnDomainSocket () {
    let pubSubGateway
    if (this.pusherCredentials) {
      pubSubGateway = new PusherPubSubGateway(this.pusherCredentials)
    } else {
      pubSubGateway = new LocalPubSubGateway()
      this.pubSubGateway = pubSubGateway
    }

    this.identityProvider = new LocalIdentityProvider()

    if (this.databaseURL) this.db = pgp(this.databaseURL)
    this.modelLayer = new ModelLayer({db: this.db})
    const controllerLayer = buildControllerLayer({
      modelLayer: this.modelLayer,
      pubSubGateway,
      identityProvider: this.identityProvider
    })
    return new Promise((resolve) => {
      const randomPortSelectionFlag = 0
      this.server = controllerLayer.listen(randomPortSelectionFlag, 'localhost', () => {
        enableDestroy(this.server)
        this.address = `http://localhost:${this.server.address().port}`
        resolve()
      })
    })
  }
}

class LocalPubSubGateway {
  constructor () {
    this.callbacksByChannelName = new Map()
    this.nextClientId = 1
  }

  getClientId () {
    return Promise.resolve((this.nextClientId++).toString())
  }

  reset () {
    this.callbacksByChannelName.clear()
  }

  broadcast (channelName, eventName, message) {
    const messageText = JSON.stringify(message)

    setTimeout(() => {
      const channelCallbacks = this.callbacksByChannelName.get(channelName)
      if (channelCallbacks) {
        channelCallbacks.forEach((callback) => {
          callback(eventName, JSON.parse(messageText))
        })
      }
    }, Math.random() * 5)
  }

  subscribe (channelName, eventName, callback) {
    return new Promise((resolve) => {
      process.nextTick(() => {
        const wrapper = (receivedEventName, data) => {
          if (receivedEventName === eventName) callback(data)
        }
        let channelCallbacks = this.callbacksByChannelName.get(channelName)
        if (!channelCallbacks) {
          channelCallbacks = new Set()
          this.callbacksByChannelName.set(channelName, channelCallbacks)
        }

        channelCallbacks.add(wrapper)
        resolve({
          dispose () {
            channelCallbacks.delete(wrapper)
          }
        })
      })
    })
  }
}

class LocalIdentityProvider {
  constructor () {
    this.usersByOauthToken = {}
  }

  getUser (oauthToken) {
    return Promise.resolve(this.usersByOauthToken[oauthToken])
  }

  setUsersByOauthToken (usersByOauthToken) {
    this.usersByOauthToken = usersByOauthToken
  }
}
