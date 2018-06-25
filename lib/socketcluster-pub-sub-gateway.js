const socketCluster = require('socketcluster-client');

module.exports =
class SocketClusterPubSubGateway {
  constructor ({appId, key, secret, cluster}) {
    var options = {
      port: 8000,
      autoConnect: true,
      autoReconnect: true
    };

    this.socket = socketCluster.create(options);
    this.socket.on('error', function (error) {
    });
  }

  broadcast (channelName, eventName, data) {
    channelName = channelName.replace(/\//g, '.')
    var message = {
        channel: `${channelName}.${eventName}`,
        data: data
    }
    this.socket.emit('publish', message);
  }

  async isOperational () {
    return new Promise((resolve) => {
        resolve(this.socket.state == this.socket.OPEN)
    })
  }
}
