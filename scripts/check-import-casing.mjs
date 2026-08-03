import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceRoot = path.join(root, 'src')
const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.css', '.json']

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath]
  })
}

function exactPath(candidate) {
  const relative = path.relative(root, candidate)
  let current = root
  const segments = relative.split(path.sep)
  for (const [index, segment] of segments.entries()) {
    if (!segment) continue
    const isFinal = index === segments.length - 1
    const match = fs.readdirSync(current).find((entry) => entry === segment || (isFinal && extensions.some((extension) => entry === segment + extension)))
    if (!match) return false
    current = path.join(current, match)
  }
  return fs.existsSync(current) && (fs.statSync(current).isFile() || fs.existsSync(path.join(current, 'index.js')) || fs.existsSync(path.join(current, 'index.jsx')) || fs.existsSync(path.join(current, 'index.ts')) || fs.existsSync(path.join(current, 'index.tsx')))
}

const failures = []
for (const file of filesIn(sourceRoot).filter((name) => /\.(jsx?|tsx?)$/.test(name))) {
  const contents = fs.readFileSync(file, 'utf8')
  for (const match of contents.matchAll(/(?:from\s*|import\s*\()(['"])(\.\.?\/[^'"]+)\1/g)) {
    const importPath = match[2]
    if (!exactPath(path.resolve(path.dirname(file), importPath))) failures.push(`${path.relative(root, file)} -> ${importPath}`)
  }
}

if (failures.length) {
  console.error('Import paths do not match tracked filesystem casing:')
  failures.forEach((failure) => console.error(`  ${failure}`))
  process.exit(1)
}

console.log('Import casing check passed.')
