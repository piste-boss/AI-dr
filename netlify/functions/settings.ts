import type { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

const store = getStore({ name: 'ai-dr-settings', consistency: 'strong' })

function jsonResponse(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  }
}

function badRequest(message: string) {
  return jsonResponse(400, { ok: false, message })
}

function parseSyncKey(event: Parameters<Handler>[0]) {
  const syncKey = event.queryStringParameters?.syncKey || event.headers['x-sync-key']
  if (!syncKey || syncKey.length < 6) {
    return null
  }
  return syncKey
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Sync-Key',
      },
      body: '',
    }
  }

  const syncKey = parseSyncKey(event)
  if (!syncKey) return badRequest('syncKey is required (6+ chars)')

  if (event.httpMethod === 'GET') {
    const data = await store.get(syncKey, { type: 'json' })
    if (!data) {
      return jsonResponse(404, { ok: false, message: 'not found' })
    }
    return jsonResponse(200, { ok: true, data })
  }

  if (event.httpMethod === 'PUT') {
    if (!event.body) return badRequest('missing body')
    try {
      const parsed = JSON.parse(event.body)
      await store.set(syncKey, parsed, {
        metadata: { updatedAt: new Date().toISOString() },
      })
      return jsonResponse(200, { ok: true })
    } catch (error) {
      console.error(error)
      return badRequest('invalid JSON')
    }
  }

  return jsonResponse(405, { ok: false, message: 'method not allowed' })
}
