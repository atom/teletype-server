const OP_TYPE_INSERT = 0
const OP_TYPE_DELETE = 1

module.exports =
class ModelLayer {
  constructor ({db}) {
    this.db = db
  }

  async createSharedBuffer ({operations}) {
    const {id: sharedBufferId} = await this.db.one('INSERT INTO shared_buffers DEFAULT VALUES RETURNING id')
    await this.db.tx(async (t) => {
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i]
        await t.none(
          `
            INSERT INTO shared_buffer_operations
            (
              shared_buffer_id,
              type, site, seq,
              text, extent,
              left_dependency_site, left_dependency_seq, offset_in_left_dependency,
              right_dependency_site, right_dependency_seq, offset_in_right_dependency
            )
            VALUES (
              $(sharedBufferId),
              $(type), $(site), $(seq),
              $(text), $(extent),
              $(left_dependency_site), $(left_dependency_seq), $(offset_in_left_dependency),
              $(right_dependency_site), $(right_dependency_seq), $(offset_in_right_dependency)
            )
          `,
          Object.assign({sharedBufferId}, operationToDB(op))
        )
      }
    })

    return sharedBufferId
  }

  async findSharedBufferOperations (id) {
    const operations = await this.db.query(`
      SELECT *
      FROM shared_buffer_operations
      WHERE shared_buffer_id = $1
    `, [id])
    return operations.map(operationFromDB)
  }
}

function operationFromDB (op) {
  let type
  switch (op.type) {
    case OP_TYPE_INSERT:
      type = 'insert'
      break
    case OP_TYPE_DELETE:
      type = 'delete'
      break
    default:
      throw new Error('Unknown operation type: ' + type)
  }

  return {
    type, opId: {site: op.site, seq: op.seq},
    text: op.text, extent: op.extent,
    leftDependencyId: {site: op.left_dependency_site, seq: op.left_dependency_seq},
    offsetInLeftDependency: op.offset_in_left_dependency,
    rightDependencyId: {site: op.right_dependency_site, seq: op.right_dependency_seq},
    offsetInRightDependency: op.offset_in_right_dependency
  }
}

function operationToDB (op) {
  let type
  switch (op.type) {
    case 'insert':
      type = OP_TYPE_INSERT
      break
    case 'delete':
      type = OP_TYPE_DELETE
      break
    default:
      throw new Error('Unknown operation type: ' + str)
  }

  return {
    type, site: op.opId.site, seq: op.opId.seq,
    text: op.text, extent: op.extent,
    left_dependency_site: op.leftDependencyId.site, left_dependency_seq: op.leftDependencyId.seq,
    offset_in_left_dependency: op.offsetInLeftDependency,
    right_dependency_site: op.rightDependencyId.site, right_dependency_seq: op.rightDependencyId.seq,
    offset_in_right_dependency: op.offsetInRightDependency
  }
}
