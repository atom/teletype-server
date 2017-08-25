const assert = require('assert')
const path = require('path')
const childProcess = require('child_process')
const temp = require('temp')
const pgp = require('pg-promise')()
const buildControllerLayer = require('./controller-layer')
const ModelLayer = require('./model-layer')
const request = require('request-promise-native')
const PusherPubSubGateway = require('../lib/pusher-pub-sub-gateway')

module.exports =
class TestServer {
  constructor ({databaseURL, pusherCredentials} = {}) {
    this.databaseURL = databaseURL
    this.pusherCredentials = pusherCredentials
    this.serverSocketPath = temp.path({suffix: '.socket'})
  }

  start () {
    if (this.databaseURL) this.migrateDatabase()
    return this.listenOnDomainSocket()
  }

  stop () {
    return new Promise((resolve) => this.server.close(resolve))
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

    this.restGateway = new LocalRestGateway({serverSocketPath: this.serverSocketPath})
    if (this.databaseURL) this.db = pgp(this.databaseURL)
    this.modelLayer = new ModelLayer({db: this.db})
    const controllerLayer = buildControllerLayer({
      modelLayer: this.modelLayer,
      pubSubGateway,
      identityProvider: this.identityProvider
    })
    return new Promise((resolve) => {
      this.server = controllerLayer.listen(this.serverSocketPath, resolve)
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

class LocalRestGateway {
  constructor ({serverSocketPath}) {
    this.serverSocketPath = serverSocketPath
  }

  get (path, options = {}) {
    let headers = options.headers || {}
    return request.get(
      `http://unix:${this.serverSocketPath}:${path}`,
      {headers, json: true}
    )
  }

  put (path, body) {
    return request.put(
      `http://unix:${this.serverSocketPath}:${path}`,
      {body, json: true}
    )
  }

  post (path, body) {
    return request.post(
      `http://unix:${this.serverSocketPath}:${path}`,
      {body, json: true}
    )
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
