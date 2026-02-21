import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  mpesa: {
    consumerKey: (process.env.MPESA_CONSUMER_KEY || '').trim(),
    consumerSecret: (process.env.MPESA_CONSUMER_SECRET || '').trim(),
    shortcode: (process.env.MPESA_SHORTCODE || '').trim(),
    passkey: (process.env.MPESA_PASSKEY || '').trim(),
    // Must be full URL including path, e.g. https://your-ngrok-url.ngrok.io/api/mpesa/callback
    callbackUrl: (process.env.MPESA_CALLBACK_URL || '').trim(),
    env: (process.env.MPESA_ENV || 'sandbox').trim(),
  },
  google: {
    clientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  },
  email: {
    host: (process.env.SMTP_HOST || '').trim(),
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: (process.env.SMTP_USER || '').trim(),
    pass: (process.env.SMTP_PASS || '').trim(),
    from: (process.env.SMTP_FROM || process.env.SMTP_USER || 'Chama App <no-reply@chamaapp.com>').trim(),
    secure: process.env.SMTP_SECURE === 'true',
  },
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').trim(),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).trim(),
  ai: {
    openaiApiKey: (process.env.OPENAI_API_KEY || '').trim(),
    mode: (process.env.AI_MODE || 'rule').trim().toLowerCase(),
    model: (process.env.AI_MODEL || 'gpt-4o-mini').trim(),
  },
}

// Validate required env vars
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is required')
}
