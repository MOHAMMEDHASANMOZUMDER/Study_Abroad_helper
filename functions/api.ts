import serverless from 'serverless-http'
import app, { initializeDatabase } from '../server/index.js'

let databaseReady: Promise<void> | undefined
const lambdaHandler = serverless(app)

const handler = async (...args: Parameters<typeof lambdaHandler>) => {
  databaseReady ??= initializeDatabase()
  await databaseReady
  return lambdaHandler(...args)
}

export { handler }
