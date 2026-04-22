const { createClient } = require('@supabase/supabase-js')
const config = require('../config')

// Inicializar cliente Supabase para validar tokens
const supabase = createClient(config.supabase.url, config.supabase.anonKey)

const authMiddleware = async (req, res, next) => {
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
    // Validar el token directamente con Supabase (soporta ES256 de forma nativa)
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      return res.status(401).json({
        error: 'invalid_token',
        message: error.message
      })
    }

    // Guardar el user_id en el request para usarlo en el proxy
    req.userId = data.user.id
    req.userRole = data.user.role || 'authenticated'

    // Pasar el user_id como header al microservicio destino
    req.headers['x-user-id'] = data.user.id
    req.headers['x-user-role'] = data.user.role || 'authenticated'

    // Dejar el header authorization intacto para que el microservicio lo vuelva a validar y saqué el ID también
    next()
  } catch (error) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Token is invalid'
    })
  }
}

module.exports = authMiddleware