exports.enforceProtocol = function (req, res, next) {
  if (req.app.get('env') === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    res.status(403).send({ message: 'HTTPS required' })
  } else {
    next()
  }
}
