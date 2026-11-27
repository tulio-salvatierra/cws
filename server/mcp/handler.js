// MCP-READ-001 (DEC-041): stateless, read-only MCP endpoint served at /api/mcp
// (vercel.json rewrites it to /api/ceo-today?mcp=1). POST only; no SSE stream or sessions.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { authenticateMcpToken } from './tokens.js'
import { registerTools } from './tools.js'

export const MCP_INSTRUCTIONS = 'Read-only view of CWS OS (Cicero Web Studio). Call get_ceo_today first. Nothing here can send, publish, or change records; do those in /admin.'

export function isMcpRequest(req) {
  const fromQuery = req.query?.mcp
  if (fromQuery === '1' || (Array.isArray(fromQuery) && fromQuery.includes('1'))) return true
  try { return new URL(req.url || '/', 'http://localhost').searchParams.get('mcp') === '1' } catch { return false }
}

function rpcError(res, status, message) {
  return res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null })
}

function toWebRequest(req) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (value === undefined) continue
    headers.set(key, Array.isArray(value) ? value.join(', ') : String(value))
  }
  return new Request(new URL('/api/mcp', `https://${headers.get('host') || 'localhost'}`), { method: 'POST', headers })
}

async function sendWebResponse(res, response) {
  res.status(response.status)
  response.headers.forEach((value, key) => res.setHeader?.(key, value))
  const text = await response.text()
  if (typeof res.send === 'function') return res.send(text)
  if (typeof res.end === 'function') return res.end(text)
  return res.json(text ? JSON.parse(text) : null)
}

export default async function mcpHandler(req, res, deps) {
  res.setHeader?.('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST')
    return rpcError(res, 405, 'Method not allowed. This MCP server is stateless and accepts POST only.')
  }

  const context = await (deps.authenticate || authenticateMcpToken)(req)
  if (context.error) {
    if (context.status === 401) res.setHeader?.('WWW-Authenticate', 'Bearer realm="cws-mcp"')
    return rpcError(res, context.status, context.error)
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { return rpcError(res, 400, 'Request body must be valid JSON.') }
  }
  if (body === undefined || body === null) return rpcError(res, 400, 'Request body must be valid JSON.')

  const server = new McpServer({ name: 'cws-os', version: '0.1.0' }, { instructions: MCP_INSTRUCTIONS })
  registerTools(server, context, deps)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  try {
    await server.connect(transport)
    const response = await transport.handleRequest(toWebRequest(req), { parsedBody: body })
    return await sendWebResponse(res, response)
  } catch {
    return rpcError(res, 500, 'The MCP request could not be handled.')
  } finally {
    await transport.close().catch(() => {})
    await server.close().catch(() => {})
  }
}
