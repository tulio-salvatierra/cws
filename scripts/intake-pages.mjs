import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { readConfigs } from '../server/intake/configs.js'
const configs = readConfigs()
if (process.argv.includes('--validate')) {
  console.log(`[intake] Validated ${configs.length} config(s)`)
} else {
  const template = await readFile('dist/index.html', 'utf8')
  const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  await mkdir('dist/intake', { recursive: true })
  for (const config of configs) {
    let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(config.clientName)} — Intake | Cicero Web Studio</title>`)
      .replace(/<meta\b[^>]*(?:name=["'](?:robots|description|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi, '')
      .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
      .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow" /></head>')
    await writeFile(`dist/intake/${config.slug}.html`, html)
  }
  console.log(`[intake] Generated ${configs.length} noindex page(s)`)
}
