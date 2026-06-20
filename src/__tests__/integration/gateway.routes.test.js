import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// ─── Mock config: apunta todos los servicios a puerto 1 (ECONNREFUSED garantizado) ──
vi.mock('../../config/index.js', () => ({
  default: {
    port: 8080,
    nodeEnv: 'test',
    supabase: { jwtSecret: 'test-secret', url: 'https://test.supabase.co', anonKey: 'test-anon' },
    services: {
      user:       'http://localhost:1',
      curriculum: 'http://localhost:1',
      grades:     'http://localhost:1',
      calendar:   'http://localhost:1',
      notes:      'http://localhost:1',
      ai:         'http://localhost:1',
    },
  },
}))

// ─── Mock Supabase para controlar la validación de JWT ────────────────────────
const mockSb = vi.hoisted(() => ({ auth: { getUser: vi.fn() } }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSb)
}))

import app from '../../app.js'

const VALID_TOKEN = { Authorization: 'Bearer valid-token' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  // Auth exitosa por defecto
  mockSb.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-123', role: 'authenticated' } },
    error: null
  })
})

// ─── Health check (siempre público) ──────────────────────────────────────────

describe('GET /health', () => {
  it('responde 200 sin autenticación', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', service: 'api-gateway' })
  })
})

// ─── Ruta 404 ────────────────────────────────────────────────────────────────

describe('Ruta inexistente', () => {
  it('responde 404 para rutas no registradas', async () => {
    const res = await request(app).get('/ruta-que-no-existe')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error', 'not_found')
  })
})

// ─── Protección de rutas (authMiddleware) ─────────────────────────────────────

describe('Rutas protegidas — sin token', () => {
  it('GET /api/users retorna 401', async () => {
    const res = await request(app).get('/api/users/profile')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'unauthorized')
  })

  it('GET /api/curriculum retorna 401', async () => {
    const res = await request(app).get('/api/curriculum')
    expect(res.status).toBe(401)
  })

  it('GET /api/grades retorna 401', async () => {
    const res = await request(app).get('/api/grades/performance/1')
    expect(res.status).toBe(401)
  })

  it('GET /api/calendar retorna 401', async () => {
    const res = await request(app).get('/api/calendar')
    expect(res.status).toBe(401)
  })

  it('GET /api/notes retorna 401', async () => {
    const res = await request(app).get('/api/notes')
    expect(res.status).toBe(401)
  })

  it('GET /api/ai retorna 401', async () => {
    const res = await request(app).get('/api/ai/sessions')
    expect(res.status).toBe(401)
  })
})

describe('Rutas protegidas — token inválido', () => {
  it('retorna 401 con mensaje de token inválido', async () => {
    mockSb.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') })
    const res = await request(app).get('/api/users/profile').set(VALID_TOKEN)
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'invalid_token')
  })
})

// ─── Proxy a servicio caído → 503 ────────────────────────────────────────────

describe('Proxy — servicio destino no disponible', () => {
  it('GET /api/users con token válido retorna 503 cuando el servicio está caído', async () => {
    // Arrange — auth pasa, pero user-service (localhost) no está corriendo
    const res = await request(app).get('/api/users/profile').set(VALID_TOKEN)
    // Assert — el proxy maneja ECONNREFUSED con 503
    expect(res.status).toBe(503)
    expect(res.body).toHaveProperty('error', 'service_unavailable')
  })

  it('GET /api/curriculum con token válido retorna 503 cuando el servicio está caído', async () => {
    const res = await request(app).get('/api/curriculum').set(VALID_TOKEN)
    expect(res.status).toBe(503)
  })
})

// ─── Ruta pública /api/auth (sin JWT) ────────────────────────────────────────

describe('Ruta pública /api/auth', () => {
  it('POST /api/auth/login NO requiere token (pasa al proxy → 503 porque el servicio está caído)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass' })
    // No debe retornar 401 (no hay auth), debe llegar al proxy → 503
    expect(res.status).not.toBe(401)
    expect(res.status).toBe(503)
  })
})
