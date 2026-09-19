import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { config } from 'dotenv'
import express, { type NextFunction, type Request, type Response } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

config({ path: '.env.local' })

const app = express()
const port = Number(process.env.PORT ?? 3001)
const jwtSecret = process.env.JWT_SECRET
if (!process.env.DATABASE_URL || !jwtSecret) throw new Error('DATABASE_URL and JWT_SECRET are required')
const geminiApiKey = process.env.GEMINI_API_KEY
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${port}/api/auth/google/callback`
const isSecureEnvironment = process.env.NODE_ENV?.toLowerCase() === ['pro', 'duction'].join('')
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, ssl: { rejectUnauthorized: false } })
const cookieOptions = { httpOnly: true, sameSite: isSecureEnvironment ? 'none' as const : 'lax' as const, secure: isSecureEnvironment, maxAge: 1000 * 60 * 60 * 24 * 7 }
const googleStateCookieOptions = { httpOnly: true, sameSite: isSecureEnvironment ? 'none' as const : 'lax' as const, secure: isSecureEnvironment, maxAge: 10 * 60 * 1000 }

app.use(cors({ origin: clientOrigin, credentials: true }))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())

type AuthenticatedRequest = Request & { user?: { id: string; email: string } }
const createToken = (user: { id: string; email: string }) => jwt.sign(user, jwtSecret, { expiresIn: '7d' })

const requireAuth = (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  const token = request.cookies.session_token
  if (!token) return response.status(401).json({ message: 'Authentication required' })
  try {
    request.user = jwt.verify(token, jwtSecret) as { id: string; email: string }
    next()
  } catch {
    return response.status(401).json({ message: 'Session expired' })
  }
}

app.get('/api/health', (_request, response) => response.json({ ok: true }))

app.get('/api/auth/google', (_request, response) => {
  if (!googleClientId || !googleClientSecret) return response.status(503).json({ message: 'Google sign-in is not configured' })
  const state = crypto.randomBytes(32).toString('hex')
  response.cookie('google_oauth_state', state, googleStateCookieOptions)
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state,
    prompt: 'select_account',
  })
  return response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

app.get('/api/auth/google/callback', async (request, response) => {
  const { code, state, error } = request.query as { code?: string; state?: string; error?: string }
  const storedState = request.cookies.google_oauth_state as string | undefined
  response.clearCookie('google_oauth_state', googleStateCookieOptions)
  if (error || !code || !state || !storedState || state.length !== storedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState))) {
    return response.redirect('/login?error=google')
  }
  if (!googleClientId || !googleClientSecret) return response.redirect('/login?error=google-config')
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenPayload = await tokenResponse.json() as { access_token?: string; error_description?: string }
    if (!tokenResponse.ok || !tokenPayload.access_token) throw new Error(tokenPayload.error_description ?? 'Google token exchange failed')
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokenPayload.access_token}` } })
    const profile = await profileResponse.json() as { email?: string; email_verified?: boolean; name?: string }
    if (!profileResponse.ok || !profile.email || profile.email_verified !== true) throw new Error('Google did not return a verified email address')

    const existing = await pool.query('SELECT id, name, email, bio, target_degree, target_countries, interests FROM users WHERE email = lower($1)', [profile.email])
    let user = existing.rows[0]
    if (!user) {
      const created = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), NULL) RETURNING id, name, email, bio, target_degree, target_countries, interests', [profile.name?.trim() || 'Google user', profile.email])
      user = created.rows[0]
    }
    response.cookie('session_token', createToken({ id: user.id, email: user.email }), cookieOptions)
    return response.redirect(clientOrigin)
  } catch (oauthError) {
    console.error('Google OAuth error', oauthError)
    return response.redirect('/login?error=google')
  }
})

type GeminiMessage = { role: 'user' | 'model'; parts: Array<{ text: string }> }

async function generateGeminiText(contents: GeminiMessage[], json = false) {
  if (!geminiApiKey) throw new Error('Gemini AI is not configured. Add GEMINI_API_KEY to .env.local.')
  const result = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': geminiApiKey },
    body: JSON.stringify({
      contents,
      ...(json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
    }),
  })
  const payload = await result.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } }
  if (!result.ok) throw new Error(payload.error?.message ?? 'Gemini request failed')
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

app.post('/api/ai/recommendations', async (request, response) => {
  const { degree, budget, goal, targetCountries } = request.body as { degree?: string; budget?: string; goal?: string; targetCountries?: string[] }
  if (!degree || !budget || !goal) return response.status(400).json({ message: 'Study level, budget, and goal are required' })
  try {
    const text = await generateGeminiText([{
      role: 'user',
      parts: [{ text: `You are a study-abroad advisor. Recommend exactly 3 destination countries for a Bangladeshi student. Study level: ${degree}. Budget preference: ${budget}. Main goal: ${goal}. Existing target countries: ${(targetCountries ?? []).join(', ') || 'none'}. Return only valid JSON in this shape: {"recommendations":[{"country":"string","summary":"one concise sentence","why":"one concise sentence"}]}. Do not invent scholarships, deadlines, or guarantees.` }],
    }], true)
    return response.json(JSON.parse(text))
  } catch (error) {
    return response.status(502).json({ message: error instanceof Error ? error.message : 'Unable to generate recommendations' })
  }
})

app.post('/api/ai/budget', async (request, response) => {
  const { country, accommodation } = request.body as { country?: string; accommodation?: string }
  if (!country || !accommodation) return response.status(400).json({ message: 'Destination and accommodation are required' })
  try {
    const text = await generateGeminiText([{
      role: 'user',
      parts: [{ text: `Estimate a realistic monthly student cost of living for a Bangladeshi international student in ${country} with ${accommodation} accommodation. Return only valid JSON in this shape: {"currency":"ISO currency code","monthlyEstimate":0,"breakdown":{"housing":0,"food":0,"transport":0,"study":0,"personal":0},"notes":"one concise caveat"}. Use approximate whole numbers, do not include tuition, and clearly treat it as an estimate.` }],
    }], true)
    return response.json(JSON.parse(text))
  } catch (error) {
    return response.status(502).json({ message: error instanceof Error ? error.message : 'Unable to calculate budget' })
  }
})

app.post('/api/ai/chat', async (request, response) => {
  const { messages } = request.body as { messages?: GeminiMessage[] }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) return response.status(400).json({ message: 'A valid conversation is required' })
  const safeMessages = messages.filter((message) => message && (message.role === 'user' || message.role === 'model') && Array.isArray(message.parts) && message.parts.every((part) => typeof part?.text === 'string'))
  if (safeMessages.length === 0) return response.status(400).json({ message: 'A valid conversation is required' })
  try {
    const text = await generateGeminiText([{ role: 'user', parts: [{ text: 'You are CUET Study Abroad Helper, a concise and practical advisor for university applications, scholarships, supervisors, visas, and student budgeting. Never claim to submit applications or guarantee admission. If information may change, tell the user to verify the official source.' }] }, ...safeMessages])
    return response.json({ message: text })
  } catch (error) {
    return response.status(502).json({ message: error instanceof Error ? error.message : 'Unable to reach the AI assistant' })
  }
})

app.post('/api/auth/register', async (request, response) => {
  const { name, email, password } = request.body as { name?: string; email?: string; password?: string }
  if (!name?.trim() || !email?.trim() || !password || password.length < 8) return response.status(400).json({ message: 'Name, valid email, and an 8-character password are required' })
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id, name, email, bio, target_degree, target_countries, interests', [name.trim(), email.trim(), passwordHash])
    const user = result.rows[0]
    response.cookie('session_token', createToken({ id: user.id, email: user.email }), cookieOptions)
    return response.status(201).json({ user })
  } catch (error) {
    if (error instanceof Object && 'code' in error && error.code === '23505') return response.status(409).json({ message: 'An account with this email already exists' })
    return response.status(500).json({ message: 'Unable to create account' })
  }
})

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body as { email?: string; password?: string }
  if (!email || !password) return response.status(400).json({ message: 'Email and password are required' })
  const result = await pool.query('SELECT id, name, email, password_hash, bio, target_degree, target_countries, interests FROM users WHERE email = lower($1)', [email])
  const user = result.rows[0]
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) return response.status(401).json({ message: 'Invalid email or password' })
  const { password_hash: _passwordHash, ...safeUser } = user
  response.cookie('session_token', createToken({ id: user.id, email: user.email }), cookieOptions)
  return response.json({ user: safeUser })
})

app.post('/api/auth/logout', (_request, response) => {
  response.clearCookie('session_token', cookieOptions)
  return response.status(204).send()
})

app.get('/api/auth/me', requireAuth, async (request: AuthenticatedRequest, response) => {
  const result = await pool.query('SELECT id, name, email, bio, target_degree, target_countries, interests, created_at FROM users WHERE id = $1', [request.user?.id])
  if (!result.rows[0]) return response.status(404).json({ message: 'User not found' })
  return response.json({ user: result.rows[0] })
})

app.patch('/api/profile', requireAuth, async (request: AuthenticatedRequest, response) => {
  const { name, bio, targetDegree, targetCountries, interests } = request.body as { name?: string; bio?: string; targetDegree?: string; targetCountries?: string[]; interests?: string[] }
  const result = await pool.query(
    'UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), target_degree = COALESCE($3, target_degree), target_countries = COALESCE($4, target_countries), interests = COALESCE($5, interests), updated_at = now() WHERE id = $6 RETURNING id, name, email, bio, target_degree, target_countries, interests',
    [name?.trim() || null, bio?.trim() || null, targetDegree || null, targetCountries || null, interests || null, request.user?.id],
  )
  return response.json({ user: result.rows[0] })
})

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error)
  response.status(500).json({ message: 'Unexpected server error' })
})

export const initializeDatabase = async () => {
  const schemaPaths = [
    path.join(process.cwd(), 'server', 'schema.sql'),
    path.join(process.cwd(), 'schema.sql'),
    path.join(path.dirname(new URL(import.meta.url).pathname), 'schema.sql'),
  ]
  const schemaPath = schemaPaths.find((candidate) => fs.existsSync(candidate))
  if (!schemaPath) throw new Error(`Database schema file not found. Checked: ${schemaPaths.join(', ')}`)
  const schema = fs.readFileSync(schemaPath, 'utf8')
  await pool.query(schema)
}

const startServer = async () => {
  await initializeDatabase()
  const server = app.listen(port)
  server.on('listening', () => console.log(`API server listening on http://localhost:${port}`))
  server.on('error', (error) => {
    console.error('API server error', error)
    process.exit(1)
  })
  const shutdown = async () => {
    server.close()
    await pool.end()
    process.exit(0)
  }
  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
}

export default app

if (process.env.NETLIFY !== 'true') {
  void startServer().catch((error) => {
    console.error('Unable to initialize the database or start the API server', error)
    process.exit(1)
  })
}
