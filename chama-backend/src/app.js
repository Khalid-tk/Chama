import express from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

// Serve uploaded files (avatars) at /uploads - use process.cwd() for dev and production (e.g. Render)
const uploadsPath = path.join(process.cwd(), 'uploads')

const app = express()

app.use('/uploads', express.static(uploadsPath))

// Security middleware (allow cross-origin so SPA on different port can call API)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000']
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
