exports.enforceProtocol = function (req, res, next) {
  if (req.app.get('env') === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    res.status(403).send({ message: 'HTTPS required' })
  } else {
    next()
  }
}

exports.authenticate = function ({identityProvider, ignoredPaths}) {
  const middleware = async function authenticate (req, res, next) {
    if (ignoredPaths.includes(req.path)) return next()

    const oauthToken = req.headers['github-oauth-token']
    if (oauthToken == null) {
      res.status(401).send({message: 'Authentication required'})
      return
    }

    try {
      res.locals.identity = await identityProvider.identityForToken(oauthToken)
    } catch (error) {
      res.status(401).send({message: 'Error resolving identity for token: ' + error.message})
      return
    }

    next()
  }

  return middleware
}
