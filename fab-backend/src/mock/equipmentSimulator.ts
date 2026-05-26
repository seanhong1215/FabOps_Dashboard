/**
 * mock/equipmentSimulator.ts
 *
 * 模擬從 OPC-UA / SECS-GEM 讀取到的機台數值。
 * 生產環境：把這層替換成真實的 OPC-UA client 或 SECS-GEM SDK。
 *
 * 常見半導體廠使用的協定：
 *   - OPC-UA  → node-opcua 套件
 *   - SECS/HSMS → 自製或廠商 SDK（通常 C++ bridge）
 *   - SOAP / REST → 直接換成 HTTP 呼叫
 */

import type { MachineState, WsPayload, SseEvent } from '../types/index.js'

// ── 初始機台狀態 ─────────────────────────────
const machines: MachineState[] = [
  {
    id: 'CVD-01', name: 'CVD-01', type: 'CVD',
    status: 'running', temperature: 314, pressure: 4.2,
    flowRate: 85, wph: 124, totalWafers: 1842,
  },
  {
    id: 'ETCH-03', name: 'ETCH-03', type: 'ETCH',
    status: 'running', rfPower: 1250, flowRate: 85,
    wph: 118, totalWafers: 2107,
  },
  {
    id: 'CMP-02', name: 'CMP-02', type: 'CMP',
    status: 'idle', rpm: 0, slurryFlow: 0,
    wph: 0, totalWafers: 987,
  },
  {
    id: 'IMP-01', name: 'IMP-01', type: 'IMP',
    status: 'running', energy: 80, dose: '2.1E15',
    wph: 105, totalWafers: 1543,
  },
  {
    id: 'LITHO-02', name: 'LITHO-02', type: 'LITHO',
    status: 'error', errorCode: 'E-0412', downtimeSec: 754,
    wph: 0, totalWafers: 3201,
  },
  {
    id: 'DIFF-01', name: 'DIFF-01', type: 'DIFF',
    status: 'running', temperature: 900, flowRate: 2.5,
    wph: 131, totalWafers: 4421,
  },
]

// ── 事件日誌樣板 ────────────────────────────
const EVENT_TEMPLATES: Array<{ level: SseEvent['level']; message: string; machineId?: string }> = [
  { level: 'ok',    message: 'CVD-01 製程參數正常，溫度在規格內',        machineId: 'CVD-01'   },
  { level: 'warn',  message: 'LITHO-02 對位偏差超過閾值 ±0.3 nm',       machineId: 'LITHO-02' },
  { level: 'error', message: 'LITHO-02 緊急停機，錯誤碼 E-0412',         machineId: 'LITHO-02' },
  { level: 'ok',    message: 'ETCH-03 批次完成，WPH=118',                machineId: 'ETCH-03'  },
  { level: 'ok',    message: 'IMP-01 劑量核對完成 2.1E15 ions/cm²',      machineId: 'IMP-01'   },
  { level: 'warn',  message: 'CMP-02 研磨液感測器訊號強度偏低',           machineId: 'CMP-02'   },
  { level: 'ok',    message: 'DIFF-01 爐管溫度穩定 900 °C',              machineId: 'DIFF-01'  },
  { level: 'ok',    message: 'MES 自動報表已上傳完成',                                          },
  { level: 'warn',  message: 'CVD-01 腔體壓力短暫超出上限 4.8 mTorr',   machineId: 'CVD-01'   },
  { level: 'ok',    message: 'ETCH-03 氣體流量校正完成',                  machineId: 'ETCH-03'  },
]

let eventIdx = 0

function rand(min: number, max: number, dec = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec))
}

// ── 模擬「從設備讀值」────────────────────────
/**
 * 生產環境：這裡改為呼叫 OPC-UA / SECS-GEM / REST API
 * 例如：const node = await session.readVariableValue('ns=2;s=CVD-01.Temperature')
 */
export function readMachinePayload(machineId: string): WsPayload | null {
  const machine = machines.find(m => m.id === machineId)
  if (!machine || machine.status === 'idle' || machine.status === 'error') return null

  const payload: WsPayload = {
    machineId,
    timestamp: Date.now(),
  }

  switch (machine.type) {
    case 'CVD':
      payload.temperature = rand(308, 318)
      payload.pressure    = rand(3.9, 4.7, 2)
      payload.flowRate    = rand(80, 92)
      payload.wph         = Math.round(rand(118, 130, 0))
      // 同步更新內部 state
      machine.temperature = payload.temperature
      machine.pressure    = payload.pressure
      break

    case 'ETCH':
      payload.rfPower  = Math.round(rand(1230, 1270, 0))
      payload.flowRate = rand(82, 90)
      payload.wph      = Math.round(rand(112, 124, 0))
      machine.rfPower  = payload.rfPower
      break

    case 'IMP':
      payload.wph  = Math.round(rand(100, 112, 0))
      machine.wph  = payload.wph
      break

    case 'DIFF':
      payload.temperature = rand(897, 904, 0)
      payload.flowRate    = rand(2.3, 2.7, 2)
      payload.wph         = Math.round(rand(126, 136, 0))
      machine.temperature = payload.temperature
      break
  }

  // 累計產出
  machine.totalWafers += Math.round(rand(0, 1, 0))

  return payload
}

/** 讀取所有運行中機台的最新數值（一次推全部） */
export function readAllPayloads(): WsPayload[] {
  return machines
    .map(m => readMachinePayload(m.id))
    .filter((p): p is WsPayload => p !== null)
}

/** 更新異常機台停機計時 */
export function tickDowntime() {
  machines
    .filter(m => m.status === 'error' && m.downtimeSec !== undefined)
    .forEach(m => { m.downtimeSec! += 2 })
}

/** 取得當前所有機台快照（SSE snapshot 或 REST 用） */
export function getAllMachines(): MachineState[] {
  return machines.map(m => ({ ...m }))
}

/** 產生下一筆事件日誌 */
export function nextEventLog(): SseEvent {
  const tmpl = EVENT_TEMPLATES[eventIdx % EVENT_TEMPLATES.length]
  eventIdx++
  return { ...tmpl, timestamp: Date.now() }
}
