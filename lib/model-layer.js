module.exports =
class ModelLayer {
  constructor ({db}) {
    this.db = db
  }

  async createSharedBuffer ({text}) {
    const result = await this.db.one('INSERT INTO shared_buffers (base_text) VALUES ($1) RETURNING id', [text])
    return result.id
  }

  async findSharedBuffer (id) {
    return this.db.one('SELECT base_text AS text FROM shared_buffers WHERE id = $1', [id])
  }
}
