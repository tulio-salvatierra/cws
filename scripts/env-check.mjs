import {
  REQUIRED_ENV_KEYS,
  REQUIRED_FOR_EMAIL_KEYS,
} from '../env.keys.js'
import { getMissingKeys, loadEnvFile, paths } from './env-utils.mjs'

const values = loadEnvFile()
const missingCore = getMissingKeys(REQUIRED_ENV_KEYS, values)
const missingEmail = getMissingKeys(REQUIRED_FOR_EMAIL_KEYS, values)

if (!Object.keys(values).length) {
  console.error('No .env file found. Run: npm run env:setup')
  process.exit(1)
}

if (missingCore.length) {
  console.error('Missing required variables:')
  missingCore.forEach((key) => console.error(`  - ${key}`))
  process.exit(1)
}

if (missingEmail.length) {
  console.warn('Email features disabled until these are set:')
  missingEmail.forEach((key) => console.warn(`  - ${key}`))
}

console.log(`Environment OK (${paths.envPath})`)
