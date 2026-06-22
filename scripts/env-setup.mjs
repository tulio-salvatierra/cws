import { ensureEnvFile } from './env-utils.mjs'

const { created, path } = ensureEnvFile()

if (created) {
  console.log(`Created ${path} from .env.example`)
  console.log('Fill in your values, then run: npm run env:check')
} else {
  console.log(`${path} already exists — no changes made`)
}
