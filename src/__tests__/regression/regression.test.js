import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const mockSb = vi.hoisted(() => ({ auth: { getUser: vi.fn() } }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSb),
}))

import app from '../../app.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('Regresión — bugs corregidos en api-gateway', () => {

  it('[BUG-001] rutas protegidas sin header Authorization retornan 401, no crashean', async () => {
    // Bug: el middleware no verificaba la ausencia del header; req.headers.authorization
    // era undefined y el split() lanzaba TypeError → 500.
    // Fix: verificar presencia del header antes de extraer el token.
    const res = await request(app).get('/api/users/profile')  // sin Authorization

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'unauthorized')
    expect(res.status).not.toBe(500)
  })

  it('[BUG-002] token con formato incorrecto (sin prefijo "Bearer ") retorna 401', async () => {
    // Bug: el middleware hacía split(" ")[1] sin verificar que el prefijo fuera "Bearer";
    // un token enviado como "Token abc" pasaba como undefined a getUser y crashaba.
    // Fix: verificar que el header empiece con "Bearer " antes del split.
    mockSb.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') })

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Token esto-no-es-bearer')

    expect(res.status).toBe(401)
    expect(res.status).not.toBe(500)
  })

  it('[BUG-003] token JWT expirado retorna 401 con error "invalid_token", no expone stack trace', async () => {
    // Bug: el catch del middleware propagaba el error de Supabase directamente al cliente,
    // exponiendo detalles internos (stack, mensaje de la librería JWT).
    // Fix: el middleware responde con { error: "invalid_token" } genérico.
    mockSb.auth.getUser.mockResolvedValue({
      data: { user: null }, error: new Error('JWT expired'),
    })

    const res = await request(app)
      .get('/api/curriculum')
      .set('Authorization', 'Bearer expired-token')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'invalid_token')
    expect(res.body).not.toHaveProperty('stack')
  })

  it('[BUG-004] ruta no registrada retorna 404 con body estructurado, no HTML de Express', async () => {
    // Bug: Express devolvía su página HTML de "Cannot GET /ruta" por defecto,
    // lo que rompía los clientes que esperaban JSON en todos los casos.
    // Fix: handler 404 explícito que responde { error: "not_found" } en JSON.
    const res = await request(app).get('/ruta-inexistente-xyz')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error', 'not_found')
    // Debe ser JSON, no HTML
    expect(res.headers['content-type']).toMatch(/json/)
  })

})
