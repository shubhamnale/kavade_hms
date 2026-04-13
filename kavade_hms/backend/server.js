import express  from 'express'
import http     from 'http'
import mongoose from 'mongoose'
import cors     from 'cors'
import dotenv   from 'dotenv'
import helmet   from 'helmet'
import rateLimit from 'express-rate-limit'
import os       from 'os'
import path     from 'path'
import fs       from 'fs'
import { fileURLToPath } from 'url'

import authRoutes    from './routes/auth.js'
import userRoutes    from './routes/users.js'
import doctorRoutes  from './routes/doctors.js'
import patientRoutes from './routes/patients.js'
import reportRoutes  from './routes/reports.js'

dotenv.config()

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET']
const missingEnv   = REQUIRED_ENV.filter(k => !process.env[k])
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`)
  console.error('   Create a .env file in /backend with MONGO_URI and JWT_SECRET.')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const app        = express()
const frontendDistPath = path.join(__dirname, '../frontend/dist')

const parseAllowedOrigins = rawOrigins =>
  String(rawOrigins || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

const allowedOrigins = parseAllowedOrigins(
  process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
)

const shouldServeFrontend =
  process.env.SERVE_FRONTEND === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND !== 'false')

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 300
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '1mb'
const URLENCODED_BODY_LIMIT = process.env.URLENCODED_BODY_LIMIT || '1mb'

const createCorsError = origin => {
  const err = new Error(`CORS blocked for origin: ${origin}`)
  err.status = 403
  err.code = 'CORS_ORIGIN_DENIED'
  return err
}

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.'
  }
})

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMITED',
    message: 'Too many login attempts. Please try again later.'
  }
})

// HTTP-only deployment: no HTTPS redirects or HSTS headers.

app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: false }))

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(createCorsError(origin))
  },
  credentials: true
}))
app.use(express.json({ limit: JSON_BODY_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: URLENCODED_BODY_LIMIT }))

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)

app.use('/api/auth',     authRoutes)
app.use('/api/users',    userRoutes)
app.use('/api/doctors',  doctorRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/reports',  reportRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kavade HMS API running', timestamp: new Date() })
})

if (process.env.NODE_ENV === 'production') {
  if (shouldServeFrontend && fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      return res.sendFile(path.join(frontendDistPath, 'index.html'))
    })
  } else if (shouldServeFrontend) {
    console.warn('⚠️  SERVE_FRONTEND is enabled but ../frontend/dist was not found.')
  }
}

app.use((err, req, res, next) => {
  if (err?.code === 'CORS_ORIGIN_DENIED') {
    return res.status(err.status || 403).json({
      success: false,
      code: err.code,
      message: err.message,
    })
  }

  console.error(err.stack)
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' })
})

const PORT = Number(process.env.PORT) || 5000
const HOST = '0.0.0.0'

const getLanUrls = port => {
  const urls = []
  const nets = os.networkInterfaces()

  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      if (net.family !== 'IPv4' || net.internal) continue
      if (net.address.startsWith('169.254.')) continue
      urls.push(`http://${net.address}:${port}`)
    }
  }

  return Array.from(new Set(urls))
}

const isHmsServerAlreadyRunning = async port => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1200)
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return false

    const body = await res.json().catch(() => null)
    return body?.status === 'OK' && String(body?.message || '').includes('Kavade HMS API')
  } catch {
    return false
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    const server = http.createServer(app)

    server.on('error', err => {
      if (err?.code !== 'EADDRINUSE') {
        console.error(`❌ Server failed: ${err.message}`)
        process.exit(1)
      }

      ;(async () => {
        if (await isHmsServerAlreadyRunning(PORT)) {
          console.log(`ℹ️  Backend is already running at http://localhost:${PORT}`)
          process.exit(0)
        }

        console.error(`❌ Port ${PORT} is already in use by another process.`)
        process.exit(1)
      })()
    })

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server → http://localhost:${PORT}`)
      const lanUrls = getLanUrls(PORT)
      if (lanUrls.length > 0) {
        console.log('🌐 Network URLs:')
        lanUrls.forEach(url => console.log(`   ${url}`))
      }
    })
  })
  .catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1) })
