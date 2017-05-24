const request = require('request-promise-native')

module.exports =
class NetworkFacade {
  constructor ({serverSocketPath}) {
    this.serverSocketPath = serverSocketPath
  }

  get (path) {
    return request.get(
      `http://unix:${this.serverSocketPath}:${path}`,
      {json: true}
    )
  }

  post (path, body) {
    return request.post(
      `http://unix:${this.serverSocketPath}:${path}`,
      {body, json: true}
    )
  }
}
