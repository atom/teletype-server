const NetworkFacade = require('./network-facade')
const SharedBuffer = require('./shared-buffer')

module.exports =
class RealTimeClient {
  constructor ({serverSocketPath}) {
    this.network = new NetworkFacade({serverSocketPath})
  }

  createSharedBuffer (delegate) {
    return SharedBuffer.create({delegate, network: this.network})
  }

  joinSharedBuffer (id, delegate) {
    return SharedBuffer.join({id, delegate, network: this.network})
  }
}
