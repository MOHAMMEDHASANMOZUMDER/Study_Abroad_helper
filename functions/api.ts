import serverless from 'serverless-http'
import app, { initializeDatabase } from '../server/index.js'

let databaseReady: Promise<void> | undefined
const lambdaHandler = serverless(app)

const handler = async (...args: Parameters<typeof lambdaHandler>) => {
  try {
    databaseReady ??= initializeDatabase()
    await databaseReady
    return await lambdaHandler(...args)
  } catch (error) {
    databaseReady = undefined
    console.error('Netlify API function failed', error instanceof Error ? error.message : error)
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'The API could not initialize. Check Netlify function logs and environment variables.' }),
    }
  }
}

export { handler }
