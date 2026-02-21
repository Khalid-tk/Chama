import express from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

// Strict CORS allowlist (no wildcard). Add production frontend URLs here or via CORS_ORIGIN env.
// Google Sign-In "origin not allowed" must be fixed in Google Cloud Console by adding the Vercel
// domain to Authorized JavaScript origins for your OAuth client.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://chama-1e62.vercel.app',
  'https://chama-1e62-bgkdedwwi-khalid-tks-projects.vercel.app',
  'https://chama-1e62-5v2fwl8fd-khalid-tks-projects.vercel.app',
]

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true)
  if (allowedOrigins.includes(origin)) return callback(null, true)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('CORS rejected origin:', origin)
  }
  callback(new Error('Not allowed by CORS'))
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}

const app = express()

// CORS must be first so OPTIONS preflight always succeeds before any auth/rate-limit/routes
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

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

// API routes
app.use('/api', routes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
