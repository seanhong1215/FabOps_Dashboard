/**
 * routes/sse.ts
 *
 * Server-Sent Events 事件日誌串流
 * 路徑：GET /events/stream
 *
 * 前端用法：
 *   const source = new EventSource('http://host/events/stream')
 *   source.onmessage = (e) => { const log = JSON.parse(e.data) }
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { nextEventLog, getAllMachines } from '../mock/equipmentSimulator.js'
import { isAllowedOrigin } from '../config/origins.js'

const sseClients = new Set<FastifyReply>()

function broadcastSse(data: unknown) {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  sseClients.forEach(reply => {
    try {
      reply.raw.write(payload)
    } catch {
      sseClients.delete(reply)
    }
  })
}

let sseTimer: ReturnType<typeof setInterval> | null = null

function startSseTimer() {
  if (sseTimer) return
  sseTimer = setInterval(() => {
    if (sseClients.size === 0) return
    broadcastSse(nextEventLog())
  }, 8000)
}

export async function sseRoutes(fastify: FastifyInstance) {

  fastify.get('/events/stream', async (request: FastifyRequest, reply: FastifyReply) => {

    // ★ 關鍵修正：SSE 用 reply.raw 寫 stream 時，
    //   @fastify/cors 的 header 已經來不及注入，
    //   必須在 flushHeaders() 前手動補上 CORS header。
    const origin = request.headers.origin ?? ''
    const allowedOrigin = isAllowedOrigin(origin) ? origin : ''

    if (allowedOrigin) {
      reply.raw.setHeader('Access-Control-Allow-Origin', allowedOrigin)
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true')
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('X-Accel-Buffering', 'no')
    reply.raw.flushHeaders()  // ← header 在這一行送出，之後再設就沒用了

    sseClients.add(reply)
    startSseTimer()
    console.log(`[SSE] 新連線，目前 ${sseClients.size} 個 client`)

    reply.raw.write(`data: ${JSON.stringify({
      level: 'ok',
      message: 'SSE 事件流連線建立',
      timestamp: Date.now(),
    })}\n\n`)

    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(': heartbeat\n\n')
      } catch {
        clearInterval(heartbeat)
      }
    }, 30_000)

    request.raw.on('close', () => {
      sseClients.delete(reply)
      clearInterval(heartbeat)
      console.log(`[SSE] 斷線，剩餘 ${sseClients.size} 個 client`)
      if (sseClients.size === 0 && sseTimer) {
        clearInterval(sseTimer)
        sseTimer = null
      }
    })

    await new Promise(() => {})
  })

  fastify.get('/api/machines', async () => getAllMachines())

  fastify.post('/api/events/emit', async (request, reply) => {
    const body = request.body as { level?: string; message?: string; machineId?: string }
    const event = {
      level: body.level ?? 'ok',
      message: body.message ?? '手動觸發事件',
      machineId: body.machineId,
      timestamp: Date.now(),
    }
    broadcastSse(event)
    return reply.status(200).send({ ok: true, event })
  })
}
