import express from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

const allowedOrigins = [
  'http://localhost:5173',
  'https://chama-1e62.vercel.app',
  'https://chama-1e62-bgkdedwwi-khalid-tks-projects.vercel.app',
  'https://chama-1e62-5v2fwl8fd-khalid-tks-projects.vercel.app',
]

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    return cb(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const app = express()

// CORS before all routes and auth so OPTIONS preflight gets CORS headers from cors()
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Serve uploaded files (avatars) at /uploads - use process.cwd() for dev and production (e.g. Render)
const uploadsPath = path.join(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsPath))

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Root endpoint
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Chama API' })
})

// Health check (root)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Temporary: debug CORS – GET from Vercel origin to verify Access-Control-* headers are present
app.get('/api/debug/cors', (req, res) => {
  res.json({
    ok: true,
    message: 'CORS debug',
    origin: req.headers.origin || null,
    timestamp: new Date().toISOString(),
  })
})

// API routes (404 handler is after this)
app.use('/api', routes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
