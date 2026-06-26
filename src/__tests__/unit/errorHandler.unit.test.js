import { describe, it, expect, vi } from 'vitest'
import errorHandler from '../../middleware/errorHandler.js'

describe('errorHandler middleware', () => {
  it('maneja error ECONNREFUSED', () => {
    const err = new Error('Connection refused')
    err.code = 'ECONNREFUSED'
    err.address = 'localhost:3000'
    const req = { method: 'GET', path: '/test' }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    const next = vi.fn()
    
    vi.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith({
      error: 'service_unavailable',
      message: 'Upstream service is not available',
      service: 'localhost:3000'
    })
  })

  it('maneja otros errores en desarrollo', () => {
    const err = new Error('Some error')
    err.status = 400
    const req = { method: 'POST', path: '/test' }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    const next = vi.fn()
    
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'internal_error',
      message: 'Some error'
    })
  })

  it('maneja otros errores en produccion (500 por defecto)', () => {
    const err = new Error('Some error')
    const req = { method: 'POST', path: '/test' }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    const next = vi.fn()
    
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.NODE_ENV = 'production'

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'internal_error',
      message: 'Something went wrong'
    })
  })
})
