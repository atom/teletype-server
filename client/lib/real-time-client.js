const SharedBuffer = require('./shared-buffer')

module.exports =
class RealTimeClient {
  constructor ({network}) {
    this.network = network
  }

  createSharedBuffer (delegate) {
    return SharedBuffer.create({delegate, network: this.network})
  }

  joinSharedBuffer (id, delegate) {
    return SharedBuffer.join({id, delegate, network: this.network})
  }
}
