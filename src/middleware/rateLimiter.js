import rateLimit from 'express-rate-limit'

export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Too many requests, please try again in a minute'
  }
})

export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    error: 'too_many_requests',
    message: 'AI service rate limit reached, please wait a moment'
  }
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'too_many_requests',
    message: 'Too many login attempts, please try again later'
  }
})
