const assert = require('assert')
const crypto = require('crypto')
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
  constructor ({databaseURL, pusherCredentials, hashSecret} = {}) {
    this.databaseURL = databaseURL
    this.pusherCredentials = pusherCredentials
    this.hashSecret = hashSecret || 'secret'
  }

  start () {
    if (this.databaseURL) this.migrateDatabase()
    return this.listen()
  }

  stop () {
    return new Promise((resolve) => this.server.destroy(resolve))
  }

  async reset () {
    if (this.databaseURL) {
      const tables = [
        'portals',
        'events'
      ]
      for (const table of tables) {
        await this.db.query(`DELETE FROM ${table}`)
      }
    }

    if (this.pubSubGateway) this.pubSubGateway.reset()
    this.identityProvider.reset()
  }

  migrateDatabase () {
    const pgMigratePath = require.resolve('node-pg-migrate/bin/node-pg-migrate')
    const migrateUpResult = childProcess.spawnSync(
      pgMigratePath,
      ['up', '--migrations-dir', path.join(__dirname, '..', 'migrations')],
      {env: Object.assign({}, process.env, {DATABASE_URL: this.databaseURL})}
    )
    if (migrateUpResult.status !== 0) {
      throw new Error('Error running migrations:\n\n' + migrateUpResult.output)
    }
  }

  listen () {
    let pubSubGateway
    if (this.pusherCredentials) {
      pubSubGateway = new PusherPubSubGateway(this.pusherCredentials)
    } else {
      pubSubGateway = new LocalPubSubGateway()
      this.pubSubGateway = pubSubGateway
    }

    this.identityProvider = new LocalIdentityProvider()

    if (this.databaseURL) this.db = pgp(this.databaseURL)
    this.modelLayer = new ModelLayer({db: this.db, hashSecret: this.hashSecret})
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
    this.identitiesByToken = {}
  }

  identityForToken (oauthToken) {
    let identity
    if (this.identitiesByToken.hasOwnProperty(oauthToken)) {
      identity = this.identitiesByToken[oauthToken]
    } else {
      identity = {login: `user-with-token-${oauthToken}`}
    }

    if (identity) {
      if (identity.id == null) identity.id = identity.login + '-id'

      return Promise.resolve(identity)
    } else {
      const error = new Error('Error resolving identity for token')
      error.statusCode = 401
      return Promise.reject(error)
    }
  }

  setIdentitiesByToken (identitiesByToken) {
    this.identitiesByToken = identitiesByToken
  }

  reset () {
    this.identitiesByToken = {}
  }
}
