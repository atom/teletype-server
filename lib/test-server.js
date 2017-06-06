const path = require('path')
const childProcess = require('child_process')
const temp = require('temp')
const pgp = require('pg-promise')()
const buildControllerLayer = require('./controller-layer')
const request = require('request-promise-native')
const PusherPubSubGateway = require('../lib/pusher-pub-sub-gateway')

module.exports =
class TestServer {
  constructor ({databaseURL, pusherCredentials}) {
    this.databaseURL = databaseURL
    this.pusherCredentials = pusherCredentials
    this.serverSocketPath = temp.path({suffix: '.socket'})
  }

  start () {
    this.migrateDatabase()
    return this.listenOnDomainSocket()
  }

  stop () {
    return new Promise((resolve) => this.server.close(resolve))
  }

  async reset () {
    const tables = ['shared_buffer_operations', 'shared_buffers']
    for (const table of tables) {
      await this.db.query(`DELETE FROM ${table}`)
    }
  }

  migrateDatabase () {
    const pgMigratePath = path.join(__dirname, '..', 'node_modules', '.bin', 'pg-migrate')
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

    this.restGateway = new LocalRestGateway({serverSocketPath: this.serverSocketPath})
    this.db = pgp(this.databaseURL)
    const controllerLayer = buildControllerLayer({db: this.db, pubSubGateway})
    return new Promise((resolve) => {
      this.server = controllerLayer.listen(this.serverSocketPath, resolve)
    })
  }
}

class LocalPubSubGateway {
  constructor () {
    this.callbacksByChannelName = new Map()
  }

  clear () {
    this.callbacksByChannelName.clear()
  }

  broadcast (channelName, eventName, message) {
    const messageJSON = JSON.stringify(message)
    process.nextTick(() => {
      const channelCallbacks = this.callbacksByChannelName.get(channelName)
      if (channelCallbacks) {
        channelCallbacks.forEach((callback) => {
          callback(eventName, JSON.parse(messageJSON))
        })
      }
    })
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
            channelCallbacks.remove(wrapper)
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

  get (path) {
    return request.get(
      `http://unix:${this.serverSocketPath}:${path}`,
      {json: true}
    )
  }

  post (path, body) {
    return request.post(
      `http://unix:${this.serverSocketPath}:${path}`,
      {body, json: true}
    )
  }
}
