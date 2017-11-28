const Pusher = require('pusher')

module.exports =
class PusherPubSubGateway {
  constructor ({appId, key, secret, cluster}) {
    this.pusherClient = new Pusher({
      appId,
      key,
      secret,
      cluster: cluster,
      encrypted: true
    })
  }

  broadcast (channelName, eventName, data) {
    channelName = channelName.replace(/\//g, '.')
    this.pusherClient.trigger(channelName, eventName, data)
  }

  async isOperational () {
    return new Promise((resolve) => {
      this.pusherClient.get({path: '/channels/unexisting-channel'}, (error, request, response) => {
        if (error) {
          resolve(false)
          return
        }

        const success = 200 <= response.statusCode && response.statusCode < 400
        resolve(success)
      })
    })
  }
}
