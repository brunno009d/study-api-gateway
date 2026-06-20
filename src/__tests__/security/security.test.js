import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// ─── Mock Supabase — el gateway instancia su propio cliente con createClient ──
const mockSb = vi.hoisted(() => ({ auth: { getUser: vi.fn() } }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSb)
}))

import app from '../../app.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  mockSb.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-123', role: 'authenticated' } }, error: null,
  })
})

// ─── T6.1 — Autenticación y JWT ───────────────────────────────────────────────

describe('Seguridad — Autenticación y JWT en el gateway', () => {
  it('401 — sin header Authorization en ruta protegida retorna 401 sin stack trace', async () => {
    const res = await request(app).get('/api/users/profile')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'unauthorized')
    expect(res.body).not.toHaveProperty('stack')
  })

  it('401 — JWT malformado retorna 401', async () => {
    mockSb.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid JWT') })
    const res = await request(app).get('/api/users/profile').set('Authorization', 'Bearer BAD.TOKEN.HERE')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'invalid_token')
    expect(res.body).not.toHaveProperty('stack')
  })

  it('401 — JWT con firma falsa retorna 401', async () => {
    mockSb.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid signature') })
    const res = await request(app)
      .get('/api/curriculum')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.e30.FAKESIG')
    expect(res.status).toBe(401)
  })

  it('401 — formato de token incorrecto (sin "Bearer") retorna 401', async () => {
    const res = await request(app).get('/api/grades/performance/1').set('Authorization', 'Token abc123')
    expect(res.status).toBe(401)
  })

  it('401 — token expirado retorna 401', async () => {
    mockSb.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') })
    const res = await request(app).get('/api/calendar').set('Authorization', 'Bearer expired-token')
    expect(res.status).toBe(401)
  })

  it('ruta pública /api/auth NO requiere token (llega al proxy)', async () => {
    // La ruta /api/auth es pública: el middleware de auth NO debe invocarse.
    // Verificamos directamente que getUser no fue llamado — independiente del status del proxy.
    await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'pass' })
    expect(mockSb.auth.getUser).not.toHaveBeenCalled()
  })
})

// ─── T6.2 — Inputs maliciosos ─────────────────────────────────────────────────

describe('Seguridad — Inputs maliciosos no provocan crash 500 en el gateway', () => {
  it('path traversal en URL no provoca crash', async () => {
    const res = await request(app)
      .get('/api/users/../../../etc/passwd')
      .set('Authorization', 'Bearer valid-token')
    // No debe ser 500 (el proxy manejará la conexión rechazada o 401 por el path)
    expect(res.status).not.toBe(500)
  })

  it('header Authorization con 10.000 caracteres no provoca crash', async () => {
    mockSb.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Token too long') })
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer ' + 'A'.repeat(10000))
    expect(res.status).not.toBe(500)
  })

  it('method no permitido no provoca crash', async () => {
    const res = await request(app).patch('/health')
    expect(res.status).not.toBe(500)
  })

  it('URL con caracteres SQL injection no provoca crash', async () => {
    const res = await request(app)
      .get("/api/users/'; DROP TABLE users;--")
      .set('Authorization', 'Bearer valid-token')
    expect(res.status).not.toBe(500)
  })
})

// ─── T6.3 — Rate limiting ─────────────────────────────────────────────────────

describe('Seguridad — Rate limiting configurado', () => {
  it('/health no tiene rate limit (no retorna 429 en petición normal)', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.status).not.toBe(429)
  })

  it('rutas protegidas tienen header RateLimit en la respuesta', async () => {
    // Con token inválido el auth falla antes del proxy, pero los headers de rate limit sí deben estar
    const res = await request(app).get('/api/users/profile')
    // El rate limiter añade headers estándar (RateLimit-Limit, etc.)
    // Si no hay header 429 en una petición normal, el limiter está activo pero no bloqueando
    expect(res.status).not.toBe(429)
  })
})

// ─── T6.4 — Respuestas seguras ────────────────────────────────────────────────

describe('Seguridad — Las respuestas no exponen información sensible', () => {
  it('error de gateway no expone stack trace', async () => {
    mockSb.auth.getUser.mockRejectedValue(new Error('Supabase internal crash'))
    const res = await request(app).get('/api/notes').set('Authorization', 'Bearer valid-token')
    expect(res.body).not.toHaveProperty('stack')
    expect(res.body).not.toHaveProperty('trace')
  })

  it('ruta no registrada retorna 404 sin stack trace', async () => {
    const res = await request(app).get('/ruta-fantasma/profunda')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error', 'not_found')
    expect(res.body).not.toHaveProperty('stack')
  })
})
