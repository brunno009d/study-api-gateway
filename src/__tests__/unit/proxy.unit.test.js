import { describe, it, expect, vi } from 'vitest'
import { createProxy } from '../../proxy/proxy.js'

describe('createProxy', () => {
  it('crea un proxy con la configuración correcta', () => {
    const proxy = createProxy('http://localhost:3000', 'users')
    expect(proxy).toBeTypeOf('function')
  })
})
