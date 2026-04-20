const jwt = require('jsonwebtoken')
const config = require('../config/config')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']

  // Verificar que venga el header
  if (!authHeader) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing authorization header'
    })
  }

  // Verificar formato "Bearer <token>"
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid authorization format. Use: Bearer <token>'
    })
  }

  const token = parts[1]

  try {
    // Verificar y decodificar el token con el secret de Supabase
    const decoded = jwt.verify(token, config.supabase.jwtSecret)

    // Guardar el user_id en el request para usarlo en el proxy
    req.userId = decoded.sub
    req.userRole = decoded.role || 'authenticated'

    // Pasar el user_id como header al microservicio destino
    req.headers['x-user-id'] = decoded.sub
    req.headers['x-user-role'] = decoded.role || 'authenticated'

    // Remover el JWT antes de reenviar (los microservicios no lo necesitan)
    // Opcional: comenta esta línea si tus microservicios también validan JWT
    // delete req.headers['authorization']

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'token_expired',
        message: 'Token has expired, please login again'
      })
    }
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Token is invalid'
    })
  }
}

module.exports = authMiddleware