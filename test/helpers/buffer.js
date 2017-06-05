module.exports =
class Buffer {
  constructor (text) {
    this.text = text
  }

  getText () {
    return this.text
  }

  setText (text) {
    this.text = text
  }

  applyMany (operations) {
    assert(Array.isArray(operations))

    for (let i = operations.length - 1; i >= 0; i--) {
      this.apply(operations[i])
    }
  }

  apply (operation) {
    if (operation.type === 'delete') {
      this.delete(operation.position, operation.extent)
    } else if (operation.type === 'insert') {
      this.insert(operation.position, operation.text)
    } else {
      throw new Error('Unknown operation type')
    }
  }

  insert (position, text) {
    this.text = this.text.slice(0, position) + text + this.text.slice(position)
  }

  delete (position, extent) {
    assert(position < this.text.length)
    assert(position + extent <= this.text.length)
    this.text = this.text.slice(0, position) + this.text.slice(position + extent)
  }
}
