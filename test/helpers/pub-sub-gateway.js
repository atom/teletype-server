module.exports =
class PubSubGateway {
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
