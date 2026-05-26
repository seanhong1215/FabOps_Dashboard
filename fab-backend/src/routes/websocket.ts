/**
 * routes/websocket.ts
 *
 * Fastify WebSocket 路由
 * 路徑：ws://host/ws/equipment
 *
 * 功能：
 *  1. 每 2s 廣播所有運行中機台的即時數值
 *  2. 接收前端指令（SUBSCRIBE / REQUEST_SNAPSHOT）
 *  3. 斷線自動清理
 */

import type { FastifyInstance } from 'fastify'
import type { SocketStream } from '@fastify/websocket'
import type { WebSocket } from 'ws'
import type { WsCommand } from '../types/index.js'
import {
  readAllPayloads,
  getAllMachines,
  tickDowntime,
} from '../mock/equipmentSimulator.js'

// 儲存原生 WebSocket 實例
const clients = new Set<WebSocket>()

function safeSend(ws: WebSocket, data: unknown) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

function broadcast(data: unknown) {
  clients.forEach(ws => safeSend(ws, data))
}

let pushTimer: ReturnType<typeof setInterval> | null = null

function startBroadcastTimer() {
  if (pushTimer) return

  pushTimer = setInterval(() => {
    if (clients.size === 0) return
    tickDowntime()
    readAllPayloads().forEach(payload => broadcast(payload))
  }, 2000)
}

export async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/ws/equipment',
    { websocket: true },
    (connection: SocketStream, _request) => {

      // ★ 關鍵修正：取原生 WebSocket 實例
      const ws: WebSocket = connection.socket

      clients.add(ws)
      startBroadcastTimer()
      console.log(`[WS] 新連線，目前 ${clients.size} 個 client`)

      // 連線後立即推送快照
      safeSend(ws, { type: 'SNAPSHOT', data: getAllMachines() })

      // 接收前端指令
      ws.on('message', (raw: Buffer) => {
        try {
          const cmd: WsCommand = JSON.parse(raw.toString())
          switch (cmd.type) {
            case 'REQUEST_SNAPSHOT':
              safeSend(ws, { type: 'SNAPSHOT', data: getAllMachines() })
              break
            case 'SUBSCRIBE':
              console.log(`[WS] SUBSCRIBE: ${cmd.machineIds?.join(', ')}`)
              break
          }
        } catch { /* 忽略非 JSON */ }
      })

      // 斷線清理
      ws.on('close', () => {
        clients.delete(ws)
        console.log(`[WS] 斷線，剩餘 ${clients.size} 個 client`)
        if (clients.size === 0 && pushTimer) {
          clearInterval(pushTimer)
          pushTimer = null
        }
      })

      ws.on('error', (err: Error) => {
        console.error('[WS] 錯誤:', err.message)
        clients.delete(ws)
      })
    }
  )
}
