import { existsSync, readFileSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(rootDir, '.env')
const examplePath = resolve(rootDir, '.env.example')

export function loadEnvFile(filePath = envPath) {
  if (!existsSync(filePath)) {
    return {}
  }

  const values = {}

  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    values[key] = value
  }

  return values
}

export function ensureEnvFile() {
  if (existsSync(envPath)) {
    return { created: false, path: envPath }
  }

  if (!existsSync(examplePath)) {
    throw new Error('Missing .env.example template.')
  }

  copyFileSync(examplePath, envPath)
  return { created: true, path: envPath }
}

export function getMissingKeys(keys, values) {
  return keys.filter((key) => !values[key]?.trim())
}

export const paths = {
  rootDir,
  envPath,
  examplePath,
}
