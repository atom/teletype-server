exports.enforceProtocol = function (req, res, next) {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    res.status(403).send({message: 'HTTPS required'})
  } else {
    next()
  }
}
