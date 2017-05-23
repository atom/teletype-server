const NetworkFacade = require('./network-facade')
const SharedBuffer = require('./shared-buffer')

module.exports =
class RealTimeClient {
  constructor ({serverSocketPath}) {
    this.network = new NetworkFacade({serverSocketPath})
  }

  createSharedBuffer (delegate) {
    return SharedBuffer.create({network: this.network, delegate})
  }
}
