const DocumentReplica = require('tachyon')

module.exports =
class SharedBuffer {
  static async create ({delegate, network}) {
    const siteId = 1
    const replica = new DocumentReplica(siteId)
    const operation = replica.insertLocal({position: 0, text: delegate.getText()})
    const {id} = await network.post('/shared-buffers', {operations: [operation]})
    const sharedBuffer = new SharedBuffer({network, delegate, siteId, id, replica})
    sharedBuffer.subscribe()
    return sharedBuffer
  }

  static async join ({id, delegate, network}) {
    const sharedBuffer = new SharedBuffer({network, delegate, id})
    await sharedBuffer.join()
    return sharedBuffer
  }

  constructor ({network, delegate, siteId, id, replica}) {
    this.network = network
    this.delegate = delegate
    this.id = id
    this.siteId = siteId
    this.replica = replica
    this.deferredOperations = []
    this.appliedOperationIds = new Set()
  }

  async join () {
    this.subscribe()
    const {siteId, operations} = await this.network.post(`/shared-buffers/${this.id}/sites`)
    this.replica = new DocumentReplica(siteId)
    this.applyRemoteOperations(operations)
    this.applyRemoteOperations(this.deferredOperations)
    this.deferredOperations = null
    this.delegate.setText(this.replica.getText())
  }

  subscribe () {
    this.subscription = this.network.subscribe(
      `/shared-buffers/${this.id}/operations`,
      this.receive.bind(this)
    )
  }

  receive (operations) {
    if (this.replica) {
      this.applyRemoteOperations(operations)
    } else {
      this.deferredOperations.push(...operations)
    }
  }

  apply (op) {
    const opToSend = this.replica.applyLocal(op)
    const opId = opIdToString(opToSend.opId)
    this.appliedOperationIds.add(opId)
    return this.network.post(
      `/shared-buffers/${this.id}/operations`,
      {operations: [opToSend]}
    )
  }

  applyRemoteOperations (operations) {
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]
      const opId = opIdToString(op.opId)
      if (!this.appliedOperationIds.has(opId)) {
        const opsToApply = this.replica.applyRemote(operations[i])
        this.appliedOperationIds.add(opId)
        this.delegate.applyMany(opsToApply)
      }
    }
  }
}

function opIdToString (opId) {
  return `${opId.site}.${opId.seq}`
}
