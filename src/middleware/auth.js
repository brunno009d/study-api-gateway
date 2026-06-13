import { createClient } from '@supabase/supabase-js'
import config from '../config/index.js'

const supabase = createClient(config.supabase.url, config.supabase.anonKey)

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing authorization header'
    })
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid authorization format. Use: Bearer <token>'
    })
  }

  const token = parts[1]

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      return res.status(401).json({
        error: 'invalid_token',
        message: error.message
      })
    }

    req.userId = data.user.id
    req.userRole = data.user.role || 'authenticated'
    req.headers['x-user-id'] = data.user.id
    req.headers['x-user-role'] = data.user.role || 'authenticated'

    next()
  } catch (error) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Token is invalid'
    })
  }
}

export default authMiddleware
