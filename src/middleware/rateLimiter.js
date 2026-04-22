const rateLimit = require('express-rate-limit')

// Límite general para rutas protegidas
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // ventana de 1 minuto
  max: 60,                  // máximo 60 requests por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Too many requests, please try again in a minute'
  }
})

// Límite más estricto para el servicio de IA (es costoso)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // solo 5 requests por minuto al servicio de IA
  message: {
    error: 'too_many_requests',
    message: 'AI service rate limit reached, please wait a moment'
  }
})

// Límite para rutas públicas (login, registro)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 20,                   // 20 intentos de login por IP
  message: {
    error: 'too_many_requests',
    message: 'Too many login attempts, please try again later'
  }
})

module.exports = { generalLimiter, aiLimiter, authLimiter }