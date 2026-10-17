// Use retained workspace channel data as assessment context. Do not infer
// voice, audience, or locale-specific guidance that the owner has not supplied.
export const CHANNEL_CONTEXT_FIELDS = 'id, name, audience, voice, updated_at'

export function channelContext(channel) {
  return {
    id: channel.id,
    channel_id: channel.id,
    source: { table: 'channels', id: channel.id, updated_at: channel.updated_at },
    channels: { name: channel.name },
    audience: channel.audience || '',
    tone: channel.voice || '',
  }
}
