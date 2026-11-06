import { readdirSync, readFileSync } from 'node:fs'
import { validateConfig } from '../../src/lib/intake/schema.js'
export function readConfigs() {
  const directory = new URL('../../src/content/intake/', import.meta.url)
  return readdirSync(directory).filter(file => file.endsWith('.json')).map(file => {
    let config
    try { config = JSON.parse(readFileSync(new URL(file, directory), 'utf8')) } catch { throw new Error(`Intake ${file}: invalid JSON`) }
    validateConfig(config, `Intake ${file}`)
    if (file !== `${config.slug}.json`) throw new Error(`Intake ${file}: filename must match slug`)
    return config
  })
}
