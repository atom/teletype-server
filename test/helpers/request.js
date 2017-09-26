const {URL} = require('url')
const request = require('request-promise-native')

exports.post = function (server, relativeURL, body) {
  const url = new URL(relativeURL, server.address).toString()
  return request.post(url, {body, json: true})
}
