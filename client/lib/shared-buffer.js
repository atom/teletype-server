module.exports =
class SharedBuffer {
  static create ({delegate, network}) {
    const text = delegate.getLocalText()
    return network.post('/shared-buffers', {text})
  }

  static async join ({id, delegate, network}) {
    const {text} = await network.get(`/shared-buffers/${id}`)
    delegate.setLocalText(text)
  }
}
