module.exports =
class ModelLayer {
  constructor ({db}) {
    this.db = db
  }

  async createSharedBuffer ({text}) {
    const result = await this.db.one('INSERT INTO shared_buffers (base_text) VALUES ($1) RETURNING id', [text])
    return result.id
  }
}
