import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), load: vi.fn() }))
vi.mock('../../server/outreach/shared.js', () => ({ authenticateWorkspace: mocks.auth, missingOutreachEnv: () => [], parseBody: x => x }))
vi.mock('../../server/laya/world-model.js', () => ({ loadWorldModel: mocks.load }))
import handler from '../ceo-today.js'
const res = () => ({ setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() })
beforeEach(() => vi.clearAllMocks())
it.each(['member', null])('rejects nonowners before reading company context (%s)', async role => {
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: role ? { role } : null }) }
  mocks.auth.mockResolvedValue({ client: { from: () => q }, user: { id: 'u' }, workspaceId: 'w' })
  const response = res(); await handler({ method: 'GET', url: '/api/ceo-today?view=world_model' }, response)
  expect(response.status).toHaveBeenCalledWith(403); expect(mocks.load).not.toHaveBeenCalled()
})
it('returns context through the existing owner route with no writes', async () => {
  const from = vi.fn(() => q)
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { role: 'owner' } }) }
  mocks.auth.mockResolvedValue({ client: { from }, user: { id: 'u' }, workspaceId: 'w' })
  mocks.load.mockResolvedValue({ authority: 'context_only' })
  const response = res(); await handler({ method: 'GET', url: '/api/ceo-today?view=world_model' }, response)
  expect(response.status).toHaveBeenCalledWith(200)
  expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
  expect(from).toHaveBeenCalledTimes(1)
  expect(response.json).toHaveBeenCalledWith({ ok: true, world_model: { authority: 'context_only' } })
})
it('fails closed when ownership lookup fails', async () => {
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ error: {} }) }
  mocks.auth.mockResolvedValue({ client: { from: () => q }, user: { id: 'u' }, workspaceId: 'w' })
  const response = res(); await handler({ method: 'GET', query: { view: 'world_model' } }, response)
  expect(response.status).toHaveBeenCalledWith(502); expect(mocks.load).not.toHaveBeenCalled()
})
