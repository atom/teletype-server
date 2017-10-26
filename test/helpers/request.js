const {URL} = require('url')
const request = require('request-promise-native')

exports.get = function (server, relativeURL, {headers}={}) {
  const url = new URL(relativeURL, server.address).toString()
  return request.get(url, {headers, json: true})
}

exports.post = function (server, relativeURL, body, {headers}={}) {
  const url = new URL(relativeURL, server.address).toString()
  return request.post(url, {headers, body, json: true})
}
