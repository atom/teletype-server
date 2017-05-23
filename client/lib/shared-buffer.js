module.exports =
class SharedBuffer {
  static async create ({delegate, network}) {
    const text = delegate.getLocalText()
    const {id} = await network.post('/shared-buffers', {text})
    return id
  }
}
