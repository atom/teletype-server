const Pusher = require('pusher')

module.exports =
class PusherPubSubGateway {
  constructor ({appId, key, secret}) {
    this.pusherClient = new Pusher({
      appId,
      key,
      secret,
      encrypted: true
    })
  }

  broadcast (channelName, eventName, data) {
    channelName = channelName.replace(/\//g, '.')
    this.pusherClient.trigger(channelName, eventName, data)
  }
}
