import { describe, it, expect, vi } from 'vitest'
import { createProxy } from '../../proxy/proxy.js'

// Mock de http-proxy-middleware para capturar la configuración y ejecutar los handlers
vi.mock('http-proxy-middleware', () => {
  return {
    createProxyMiddleware: vi.fn((config) => {
      // Retornar la config para poder probar los handlers 'on'
      return { config }
    }),
    fixRequestBody: vi.fn()
  }
})

describe('createProxy', () => {
  it('crea un proxy con la configuración correcta', () => {
    const proxy = createProxy('http://localhost:3000', 'users')
    expect(proxy).toBeDefined()
  })

  it('maneja eventos de proxyReq, proxyRes y error', () => {
    const proxyMiddleware = createProxy('http://localhost:3000', 'users')
    const { on } = proxyMiddleware.config
    
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const req = { method: 'GET', path: '/test' }
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const proxyReq = { setHeader: vi.fn(), getHeader: vi.fn() }
    const proxyRes = { statusCode: 200 }
    
    // Test proxyReq
    on.proxyReq(proxyReq, req, res)
    expect(consoleLogSpy).toHaveBeenCalledWith('[PROXY] GET /api/users/test → http://localhost:3000')

    // Test proxyRes
    on.proxyRes(proxyRes, req)
    expect(consoleLogSpy).toHaveBeenCalledWith('[PROXY] Response 200 ← http://localhost:3000/test')

    // Test error
    on.error(new Error('Test error'), req, res)
    expect(consoleErrorSpy).toHaveBeenCalledWith('[PROXY ERROR] No se pudo conectar a http://localhost:3000:', 'Test error')
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith({
      error: 'service_unavailable',
      message: 'Service users is currently unavailable'
    })
  })
})
