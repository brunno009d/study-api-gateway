const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const routes = require('./routes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// Middleware global 
app.use(morgan('dev'))

app.use(cors({
  origin: [
    'http://localhost:5173',               // Vite local
    'https://tu-frontend.vercel.app'       // Producción
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Health check global del gateway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  })
})

// Rutas (ANTES de express.json() para no corromper el body de los proxies)
app.use(routes)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Ruta no encontrada 
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

// Manejo de errores (siempre al final)
app.use(errorHandler)

module.exports = app