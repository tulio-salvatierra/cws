import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const examplePath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env.example')
const content = readFileSync(examplePath, 'utf8')

const secretPatterns = [
  { name: 'Resend API key', pattern: /RESEND_API_KEY=re_[A-Za-z0-9_]{10,}/ },
  {
    name: 'Google Sheets webhook secret',
    pattern: /GOOGLE_SHEETS_WEBHOOK_SECRET=AKfycb/,
  },
  {
    name: 'Supabase anon JWT',
    pattern: /VITE_SUPABASE_ANON_KEY=eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./,
  },
]

const violations = secretPatterns.filter(({ pattern }) => pattern.test(content))

if (violations.length) {
  console.error('.env.example contains values that look like real secrets:')
  violations.forEach(({ name }) => console.error(`  - ${name}`))
  console.error('Use placeholders only. Real values belong in .env (gitignored).')
  process.exit(1)
}

console.log('.env.example uses placeholders only')
