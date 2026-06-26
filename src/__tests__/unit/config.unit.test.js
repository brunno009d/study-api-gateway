import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de dotenv para que no sobreescriba process.env
vi.mock('dotenv/config', () => ({}))

// Mock de dotenv para que no sobreescriba process.env
vi.mock('dotenv/config', () => ({}))

describe('Config Index', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('lanza process.exit si no hay SUPABASE_JWT_SECRET', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const originalSecret = process.env.SUPABASE_JWT_SECRET
    delete process.env.SUPABASE_JWT_SECRET

    await import('../../config/index.js')

    expect(errorSpy).toHaveBeenCalledWith('ERROR: SUPABASE_JWT_SECRET no está definido en .env')
    expect(exitSpy).toHaveBeenCalledWith(1)

    process.env.SUPABASE_JWT_SECRET = originalSecret || 'mock'
  })
})
