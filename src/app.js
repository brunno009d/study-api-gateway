import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import routes from './routes/index.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.use(morgan('dev'))

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://study-frontend-chi.vercel.app',
    'https://popstudy.cl',
    'https://www.popstudy.cl'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  })
})

// Rutas ANTES de express.json() para no corromper el body de los proxies
app.use(routes)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

app.use(errorHandler)

export default app
