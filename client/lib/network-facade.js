const request = require('request-promise-native')

module.exports =
class NetworkFacade {
  constructor ({serverSocketPath}) {
    this.serverSocketPath = serverSocketPath
  }

  post (path, body) {
    return request.post(
      `http://unix:${this.serverSocketPath}:${path}`,
      {body, json: true}
    )
  }
}
