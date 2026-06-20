import { Router } from 'express'
import { createProxy } from '../proxy/proxy.js'
import authMiddleware from '../middleware/auth.js'
import { generalLimiter, aiLimiter, authLimiter } from '../middleware/rateLimiter.js'
import config from '../config/index.js'

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

router.use('/api/ai',
  aiLimiter, authMiddleware,
  createProxy(config.services.ai, 'ai'))

export default router
