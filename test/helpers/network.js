const request = require('request-promise-native')

module.exports =
class Network {
  constructor ({serverSocketPath}) {
    this.serverSocketPath = serverSocketPath
    this.callbacksByChannelName = new Map()
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

  broadcast (channelName, message) {
    const messageJSON = JSON.stringify(message)
    process.nextTick(() => {
      const channelCallbacks = this.callbacksByChannelName.get(channelName)
      if (channelCallbacks) {
        channelCallbacks.forEach((callback) => {
          callback(JSON.parse(messageJSON))
        })
      }
    })
  }

  subscribe (channelName, callback) {
    let channelCallbacks = this.callbacksByChannelName.get(channelName)
    if (!channelCallbacks) {
      channelCallbacks = new Set()
      this.callbacksByChannelName.set(channelName, channelCallbacks)
    }

    channelCallbacks.add(callback)
    return {
      dispose () {
        channelCallbacks.remove(callback)
      }
    }
  }
}
