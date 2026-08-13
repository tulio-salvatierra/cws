/* global process */

import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const scriptPath = resolve(process.cwd(), 'scripts/record-published.sh')

async function runScript(args, env = {}) {
  return execFileAsync('bash', [scriptPath, ...args], {
    env: { ...process.env, ...env },
  })
}

function endpoint(responseBody) {
  return `data:application/json,${encodeURIComponent(JSON.stringify(responseBody))}`
}

describe('record-published.sh', () => {
  it('fails clearly when the secret is unset', async () => {
    await expect(runScript(
      ['instagram', 'es', 'https://instagram.com/p/ABC'],
      { PUBLISHED_WEBHOOK_SECRET: '' },
    )).rejects.toMatchObject({
      stderr: expect.stringContaining('PUBLISHED_WEBHOOK_SECRET is not set'),
    })
  })

  it('rejects an invalid platform before sending', async () => {
    await expect(runScript(
      ['tiktok', 'en', 'https://example.com/post/ABC'],
      { PUBLISHED_WEBHOOK_SECRET: 'local-test-secret' },
    )).rejects.toMatchObject({
      stderr: expect.stringContaining('Accepted values: instagram, facebook, x'),
    })
  })

  it('records a manual post, derives its ID, and includes an optional brief version', async () => {
    const result = await runScript(
      ['instagram', 'es', 'https://instagram.com/p/POST-123/', '4'],
      {
        PUBLISHED_WEBHOOK_SECRET: 'local-test-secret',
        PUBLISHED_ENDPOINT_URL: endpoint({ ok: true, created: true, id: 'published-1' }),
      },
    )

    expect(result.stdout).toContain('Published row ID: published-1')
    expect(result.stdout).toContain('Created: yes')
    expect(result.stdout).toContain('External post ID: POST-123')
  })

  it('reports an idempotent existing record', async () => {
    const result = await runScript(
      ['youtube', 'en', 'https://youtu.be/video-123'],
      {
        PUBLISHED_WEBHOOK_SECRET: 'local-test-secret',
        PUBLISHED_ENDPOINT_URL: endpoint({
          ok: true,
          created: false,
          id: 'published-existing',
        }),
      },
    )

    expect(result.stdout).toContain('Published row ID: published-existing')
    expect(result.stdout).toContain('Created: no (already existed)')
    expect(result.stdout).toContain('External post ID: video-123')
  })
})
