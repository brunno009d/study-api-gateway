const { Router } = require('express')
const { createProxy } = require('../proxy/proxy')
const authMiddleware = require('../middleware/auth')
const { generalLimiter, aiLimiter, authLimiter } = require('../middleware/rateLimiter')
const config = require('../config')

const router = Router()

// ── Rutas públicas (sin JWT) ──────────────────────────────────
router.use('/api/auth', authLimiter, createProxy(config.services.user, 'auth'))

// ── Rutas protegidas (JWT requerido) ──────────────────────────
router.use('/api/users',
  generalLimiter, authMiddleware,
  createProxy(config.services.user, 'users'))

router.use('/api/curriculum',
  generalLimiter, authMiddleware,
  createProxy(config.services.curriculum, 'curriculum'))

router.use('/api/grades',
  generalLimiter, authMiddleware,
  createProxy(config.services.grades, 'grades'))

router.use('/api/courses',
  generalLimiter, authMiddleware,
  createProxy(config.services.grades, 'courses'))

router.use('/api/calendar',
  generalLimiter, authMiddleware,
  createProxy(config.services.calendar, 'calendar'))

router.use('/api/notes',
  generalLimiter, authMiddleware,
  createProxy(config.services.notes, 'notes'))

router.use('/api/materials',
  generalLimiter, authMiddleware,
  createProxy(config.services.notes, 'materials'))

// Rate limit estricto para IA
router.use('/api/ai',
  aiLimiter, authMiddleware,
  createProxy(config.services.ai, 'ai'))

module.exports = router