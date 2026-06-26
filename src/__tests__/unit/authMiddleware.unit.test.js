import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock config (evita process.exit(1) si JWT_SECRET no está en .env) ────────
vi.mock('../../config/index.js', () => ({
  default: {
    supabase: { url: 'http://fake.supabase.co', anonKey: 'fake-anon', jwtSecret: 'fake-secret' },
    services: {}
  }
}))

// ─── Mock Supabase (intercepta createClient) ──────────────────────────────────
const mockSb = vi.hoisted(() => ({ auth: { getUser: vi.fn() } }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSb)
}))

import authMiddleware from '../../middleware/auth.js'

const mockRes = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

beforeEach(() => vi.clearAllMocks())

// ─── Casos sin token ──────────────────────────────────────────────────────────

describe('authMiddleware — sin header', () => {
  it('retorna 401 cuando no viene el header Authorization', async () => {
    // Arrange
    const req = { headers: {} }
    const res = mockRes()
    const next = vi.fn()
    // Act
    await authMiddleware(req, res, next)
    // Assert
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'unauthorized' }))
    expect(next).not.toHaveBeenCalled()
  })

  it('retorna 401 cuando el formato no es "Bearer <token>"', async () => {
    const req = { headers: { authorization: 'Token abc123' } }
    const res = mockRes()
    const next = vi.fn()
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'unauthorized' }))
    expect(next).not.toHaveBeenCalled()
  })

  it('retorna 401 cuando viene solo "Bearer" sin token', async () => {
    const req = { headers: { authorization: 'Bearer' } }
    const res = mockRes()
    const next = vi.fn()
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})

// ─── Token inválido ────────────────────────────────────────────────────────────

describe('authMiddleware — token inválido', () => {
  it('retorna 401 cuando Supabase rechaza el token', async () => {
    // Arrange
    mockSb.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') })
    const req = { headers: { authorization: 'Bearer bad-token' } }
    const res = mockRes()
    const next = vi.fn()
    // Act
    await authMiddleware(req, res, next)
    // Assert
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_token' }))
    expect(next).not.toHaveBeenCalled()
  })

  it('retorna 401 cuando Supabase lanza una excepción', async () => {
    mockSb.auth.getUser.mockRejectedValue(new Error('Network error'))
    const req = { headers: { authorization: 'Bearer bad-token' } }
    const res = mockRes()
    const next = vi.fn()
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})

// ─── Token válido ──────────────────────────────────────────────────────────────

describe('authMiddleware — token válido', () => {
  it('llama a next() y agrega userId al request', async () => {
    // Arrange
    mockSb.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', role: 'authenticated' } },
      error: null
    })
    const req = { headers: { authorization: 'Bearer valid-token' } }
    const res = mockRes()
    const next = vi.fn()
    // Act
    await authMiddleware(req, res, next)
    // Assert
    expect(next).toHaveBeenCalledOnce()
    expect(req.userId).toBe('user-123')
    expect(req.userRole).toBe('authenticated')
    expect(req.headers['x-user-id']).toBe('user-123')
    expect(res.status).not.toHaveBeenCalled()
  })
})
