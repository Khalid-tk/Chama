import express from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

const allowedOrigins = [
  'http://localhost:5173',
  'https://chama-eta.vercel.app',
  'https://chama-1e62.vercel.app',
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    if (origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS: ' + origin))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

const app = express()

// Global CORS – MUST be first so OPTIONS preflight gets CORS headers from cors() (no manual 204)
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// JSON parser immediately after CORS
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// COOP for Google Sign-in popups
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  next()
})

// Serve uploaded files (avatars)
const uploadsPath = path.join(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsPath))

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Chama API' })
})

// Health check (root)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Debug CORS – call from Vercel origin to verify Access-Control-* headers in production
app.get('/api/debug/cors', (req, res) => {
  res.json({
    ok: true,
    origin: req.headers.origin || null,
  })
})

// API routes (404 handler is after this)
app.use('/api', routes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
