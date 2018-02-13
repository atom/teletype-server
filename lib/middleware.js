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

exports.disableResponseHeaders = function ({headers, paths}) {
  const middleware = async function disableResponseHeaders (req, res, next) {
    if (!paths.includes(req.path)) return next()

    const setHeaderWithoutMonkeyPatch = res.setHeader

    res.setHeader = (name, value) => {
      if (!headers.includes(name.toLowerCase())) {
        setHeaderWithoutMonkeyPatch.apply(res, [name, value])
      }
    }
    next()
  }

  return middleware
}
