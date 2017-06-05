const DocumentReplica = require('tachyon')

module.exports =
class SharedBuffer {
  static async create ({delegate, network}) {
    const site = 1
    const replica = new DocumentReplica(site)
    const operation = replica.insertLocal({position: 0, text: delegate.getText()})
    const {id} = await network.post('/shared-buffers', {operations: [operation]})
    return new SharedBuffer({site, id, replica})
  }

  static async join ({id, delegate, network}) {
    const {operations} = await network.get(`/shared-buffers/${id}`)
    const replica = new DocumentReplica(1)
    for (let i = 0; i < operations.length; i++) {
      replica.applyRemote(operations[i])
    }
    delegate.setText(replica.getText())
    return new SharedBuffer({id, replica})
  }

  constructor ({site, id, replica}) {
    this.id = id
  }
}
