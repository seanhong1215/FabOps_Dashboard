/**
 * src/index.ts — Fastify 主程式
 *
 * 啟動：
 *   npm run dev          ← 開發（tsx watch 熱重載）
 *   npm run build && npm start  ← 生產
 *
 * 端點：
 *   ws://localhost:3000/ws/equipment   ← WebSocket（設備即時數據）
 *   GET  /events/stream                ← SSE（事件日誌串流）
 *   GET  /api/machines                 ← REST 快照
 *   POST /api/events/emit              ← 手動發事件（測試用）
 */


import Fastify from 'fastify'
import fastifyWebSocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'

import { websocketRoutes } from './routes/websocket.js'
import { sseRoutes } from './routes/sse.js'
import { isAllowedOrigin } from './config/origins.js'

const PORT = Number(process.env.PORT ?? 3000)
const HOST = process.env.HOST ?? '0.0.0.0'

async function bootstrap() {
  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss' },
      },
    },
  })

  // ── CORS ─────────────────────────────────
  // 用 function 寫法，避免 regex 在部分 @fastify/cors 版本
  // 拋出 "unable to determine transport target" 錯誤
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // origin 為 undefined = 同源請求 或 非瀏覽器工具（curl / Postman）
      if (!origin) return cb(null, true)

      if (isAllowedOrigin(origin)) {
        cb(null, true)
      } else {
        fastify.log.warn(`[CORS] blocked origin: ${origin}`)
        cb(null, false)
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  })

  // ── WebSocket 插件 ────────────────────────
  await fastify.register(fastifyWebSocket, {
    options: { maxPayload: 1048576 },
  })

  // ── 路由註冊 ─────────────────────────────
  await fastify.register(websocketRoutes)
  await fastify.register(sseRoutes)

  // ── 健康檢查 ─────────────────────────────
  fastify.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  }))

  // ── 啟動 ─────────────────────────────────
  try {
    await fastify.listen({ port: PORT, host: HOST })
    console.log(`
╔════════════════════════════════════════╗
║   FAB Backend Server 已啟動            ║
║  WebSocket  ws://localhost:${PORT}/ws/equipment
║  SSE        http://localhost:${PORT}/events/stream
║  REST       http://localhost:${PORT}/api/machines
║  Health     http://localhost:${PORT}/health
╚════════════════════════════════════════╝
    `)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

bootstrap()
