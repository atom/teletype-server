const assert = require('assert')
const enableDestroy = require('server-destroy')

module.exports =
class HTTPTestServer {
  constructor ({app} = {}) {
    this.app = app
  }

  listen () {
    return new Promise((resolve) => {
      const randomPortSelectionFlag = 0
      this.server = this.app.listen(randomPortSelectionFlag, 'localhost', () => {
        enableDestroy(this.server)
        resolve()
      })
    })
  }

  address () {
    assert(this.server, 'Call listen() to start the server before asking for its address')
    return `http://localhost:${this.server.address().port}`
  }

  destroy () {
    return new Promise((resolve) => this.server.destroy(resolve))
  }
}
