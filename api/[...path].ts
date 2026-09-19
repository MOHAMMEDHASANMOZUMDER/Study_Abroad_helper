import type { Request, Response } from 'express'
import app, { initializeDatabase } from '../server/index.js'

let databaseReady: Promise<void> | undefined

export default async function handler(request: Request, response: Response) {
  try {
    databaseReady ??= initializeDatabase()
    await databaseReady
    return app(request, response)
  } catch (error) {
    databaseReady = undefined
    console.error('Vercel API function failed', error instanceof Error ? error.message : error)
    return response.status(502).json({ message: 'The API could not initialize. Check Vercel function logs and environment variables.' })
  }
}
